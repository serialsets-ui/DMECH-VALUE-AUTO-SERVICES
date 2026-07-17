import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { StaffRole } from "@/types";

// Marks (or un-marks) the consignment payout on a sold vehicle as paid.
// Finance-level action, not general vehicle editing -- gated to the same
// roles as Instalments/Payments, not the broader vehicle EDIT_ROLES.
const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted to record consignment payouts." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const paid = body?.paid === true;

  const service = createServiceClient();
  const { data: before } = await service.from("vehicles").select("consignment_payout_paid_at").eq("id", id).maybeSingle();

  const { data, error } = await service
    .from("vehicles")
    .update({ consignment_payout_paid_at: paid ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id, consignment_payout_paid_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update the payout status." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "update",
    tableName: "vehicles",
    recordId: id,
    oldValue: { consignment_payout_paid_at: before?.consignment_payout_paid_at ?? null },
    newValue: { consignment_payout_paid_at: data.consignment_payout_paid_at },
  });

  return NextResponse.json({ vehicle: data });
}
