import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { approvalsRequired } from "@/lib/approval";
import { logAudit } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "accountant"];

// Tier 1-2 need one staff approval; Tier 3-4 (larger requested credit) need
// two distinct approvers before approval_status actually flips to
// 'approved' — see lib/approval.ts. Declining is always single-step.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to approve customers." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action === "decline" ? "decline" : body?.action === "approve" ? "approve" : null;
  if (!action) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: customer } = await service.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  if (action === "decline") {
    const { data, error } = await service.from("customers").update({ approval_status: "declined" }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: "Could not decline this customer." }, { status: 500 });
    await logAudit({
      userId: staff.id,
      action: "decline",
      tableName: "customers",
      recordId: id,
      oldValue: { approval_status: customer.approval_status },
      newValue: { approval_status: "declined" },
    });
    await queueNotification({
      recipientId: customer.user_id,
      recipientPhone: customer.phone,
      channel: "email",
      template: "customer_approval_decision",
      payload: { status: "declined", customerName: customer.full_name },
    });
    return NextResponse.json({ customer: data });
  }

  const approvedBy: string[] = customer.approved_by ?? [];
  if (approvedBy.includes(staff.id)) {
    return NextResponse.json({ error: "You've already approved this customer." }, { status: 400 });
  }

  const nextApprovedBy = [...approvedBy, staff.id];
  const required = approvalsRequired((customer.approval_tier as 1 | 2 | 3 | 4) ?? 1);
  const nextStatus = nextApprovedBy.length >= required ? "approved" : "pending";

  const { data, error } = await service
    .from("customers")
    .update({ approved_by: nextApprovedBy, approval_status: nextStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not record your approval." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "approve",
    tableName: "customers",
    recordId: id,
    oldValue: { approval_status: customer.approval_status, approved_by: approvedBy },
    newValue: { approval_status: nextStatus, approved_by: nextApprovedBy },
  });

  if (nextStatus === "approved") {
    await queueNotification({
      recipientId: customer.user_id,
      recipientPhone: customer.phone,
      channel: "email",
      template: "customer_approval_decision",
      payload: { status: "approved", customerName: customer.full_name },
    });
  }

  return NextResponse.json({ customer: data, approvalsRequired: required });
}
