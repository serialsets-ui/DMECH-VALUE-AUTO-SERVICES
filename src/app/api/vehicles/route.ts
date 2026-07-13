import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole, AcquisitionChannel } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

const WRITABLE = [
  "make", "model", "year", "vin", "colour", "fuel_type", "engine_cc", "battery_range_km",
  "source_region", "source_detail", "condition", "acquisition_channel",
  "purchase_price_usd_cents", "shipping_cost_usd_cents", "customs_duty_kobo", "cost_basis_kobo",
  "consignor_customer_id", "consignment_commission_pct", "trade_in_credit_kobo",
] as const;

// Import-channel vehicles start their lifecycle at 'sourced' (the first
// stage in LIFECYCLE_STAGES_BY_CHANNEL.import); every other channel starts
// at 'intake', since those two early stages exist specifically for
// non-import acquisitions. Getting this wrong would silently desync the
// Vehicles detail page's lifecycle stepper from the vehicle's real state.
function initialStage(channel: AcquisitionChannel) {
  return channel === "import" ? "sourced" : "intake";
}

export async function POST(request: Request) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to add vehicles." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.make || !body.model || !body.year || !body.source_region || !body.condition || !body.acquisition_channel) {
    return NextResponse.json({ error: "Make, model, year, source, condition, and channel are required." }, { status: 400 });
  }

  const insertRow: Record<string, unknown> = { lifecycle_stage: initialStage(body.acquisition_channel) };
  for (const key of WRITABLE) {
    if (key in body) insertRow[key] = body[key];
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("vehicles").insert(insertRow).select().single();

  if (error) {
    return NextResponse.json({ error: "Could not create the vehicle." }, { status: 500 });
  }

  return NextResponse.json({ vehicle: data });
}
