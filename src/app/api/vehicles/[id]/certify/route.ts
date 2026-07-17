import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

// Certifying a vehicle and issuing its warranty happen in one step on
// purpose (see InspectionPanel.tsx's comment) — a certified vehicle with
// no warranty_policies row is exactly the gap this route exists to close.
// Both writes use the service-role client: warranty_policies has no
// client-side staff INSERT policy (003's "mutations go through route
// handlers" convention), and neither does vehicles have a staff UPDATE
// policy at all — every mutation route in this project needs service-role.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to certify vehicles." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const coverageTier = body?.coverage_tier;
  const durationDays = Number(body?.duration_days);
  if (!body || !["basic", "extended"].includes(coverageTier) || !durationDays || durationDays <= 0) {
    return NextResponse.json({ error: "Coverage tier and a valid duration are required." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("sale_price_kobo")
    .eq("id", id)
    .maybeSingle();
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  const { data: configRow } = await supabase
    .from("platform_config")
    .select("value")
    .eq("key", "warranty_reserve_contribution_pct")
    .maybeSingle();
  const reservePct = typeof configRow?.value === "number" ? configRow.value : 5;

  const salePriceKobo = vehicle.sale_price_kobo ?? 0;
  const reserveContributionKobo = Math.round((salePriceKobo * reservePct) / 100);

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const { data: policy, error: policyError } = await supabase
    .from("warranty_policies")
    .insert({
      vehicle_id: id,
      coverage_tier: coverageTier,
      duration_days: durationDays,
      mileage_limit_km: body.mileage_limit_km ?? null,
      covered_components: Array.isArray(body.covered_components) ? body.covered_components : [],
      price_kobo: Number(body.price_kobo) || 0,
      reserve_contribution_pct: reservePct,
      reserve_contribution_kobo: reserveContributionKobo,
      status: "active",
      starts_at: startsAt.toISOString().slice(0, 10),
      expires_at: expiresAt.toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (policyError) {
    return NextResponse.json({ error: "Could not create the warranty policy." }, { status: 500 });
  }

  const { error: vehicleError } = await supabase
    .from("vehicles")
    .update({ certification_status: "certified", lifecycle_stage: "available" })
    .eq("id", id);

  if (vehicleError) {
    return NextResponse.json(
      { error: "Warranty created, but the vehicle record failed to update." },
      { status: 500 },
    );
  }

  await logAudit({
    userId: staff.id,
    action: "certify",
    tableName: "vehicles",
    recordId: id,
    newValue: { certification_status: "certified", warranty_policy_id: policy.id },
  });

  return NextResponse.json({ warrantyPolicy: policy });
}
