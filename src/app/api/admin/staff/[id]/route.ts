import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { StaffRole } from "@/types";

const ALLOWED = ["role", "is_active"] as const;

const VALID_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "ops_manager",
  "workshop_lead",
  "sales_rep",
  "accountant",
];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await roleGuard(["super_admin"]);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("role" in body && !VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  const supabase = createServiceClient();
  const { data: before } = await supabase.from("users").select("role, is_active, auth_user_id").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update staff record." }, { status: 500 });
  }

  // Deactivating a staff account (e.g. incident response on a suspected
  // compromise) must not just be gated at the app layer -- staffGuard()
  // rejecting is_active=false on the next request is already effective, but
  // that still leaves their existing Supabase session able to hit
  // unauthenticated endpoints or simply outlive this check somewhere it
  // wasn't applied. Banning at the auth layer too kills the session/refresh
  // token outright. Reactivating clears the ban the same way.
  if ("is_active" in updates && before?.auth_user_id) {
    await supabase.auth.admin.updateUserById(before.auth_user_id, {
      ban_duration: updates.is_active ? "none" : "876000h",
    });
  }

  await logAudit({ userId: staff.id, action: "update", tableName: "users", recordId: id, oldValue: before, newValue: updates });

  return NextResponse.json({ staff: data });
}
