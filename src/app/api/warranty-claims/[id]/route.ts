import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const ALLOWED = ["status", "assessed_cost_kobo", "approved_kobo"] as const;

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant"];

// warranty_claims has no staff UPDATE policy (customers can only insert
// their own claim) and warranty_reserve_ledger has no client insert path
// at all by design — service-role for both, matching every other Phase 2B
// route.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to assess warranty claims." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("warranty_claims").select("status").eq("id", id).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }
  if (updates.status === "approved" || updates.status === "denied" || updates.status === "paid") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("warranty_claims").update(updates).eq("id", id).select().single();
  if (error) {
    return NextResponse.json({ error: "Could not update the claim." }, { status: 500 });
  }

  // Write the ledger payout exactly once, on the transition into 'approved'
  // with an amount set — not on every save while status is already
  // 'approved' (re-saving other fields shouldn't double-count the payout).
  const justApproved = updates.status === "approved" && existing.status !== "approved";
  if (justApproved && data.approved_kobo) {
    await supabase.from("warranty_reserve_ledger").insert({
      entry_type: "claim_payout",
      amount_kobo: -Math.abs(data.approved_kobo),
      related_claim_id: data.id,
      related_policy_id: data.warranty_policy_id,
      note: `Claim payout for warranty claim ${data.id}`,
    });
  }

  return NextResponse.json({ claim: data });
}
