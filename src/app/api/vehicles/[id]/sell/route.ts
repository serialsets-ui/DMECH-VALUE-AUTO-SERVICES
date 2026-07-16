import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { queueNotification } from "@/lib/notifications";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to record a sale." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const customerId = typeof body?.customer_id === "string" ? body.customer_id : "";
  if (!customerId) {
    return NextResponse.json({ error: "Select the buyer before recording the sale." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }
  if (!vehicle.sale_price_kobo) {
    return NextResponse.json({ error: "Set a sale price before recording the sale." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { lifecycle_stage: "sold", buyer_id: customerId };

  if (vehicle.acquisition_channel === "consignment" && vehicle.consignment_commission_pct != null) {
    updates.consignment_payout_kobo = Math.round(
      vehicle.sale_price_kobo * (1 - vehicle.consignment_commission_pct / 100),
    );
  }

  const { error: updateError } = await supabase.from("vehicles").update(updates).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not record the sale." }, { status: 500 });
  }

  // Sale invoice — VAT-exempt by default (see migration 007's comment): the
  // invoice shows exactly sale_price_kobo, the price already agreed
  // throughout the rest of the app, rather than silently adding a charge on
  // top until staff confirm the correct VAT treatment with their accountant.
  const description = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.vin ? ` (VIN: ${vehicle.vin})` : ""}`;
  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      doc_type: "invoice",
      vehicle_id: id,
      customer_id: customerId,
      line_items: [
        {
          description,
          quantity: 1,
          unit_price_kobo: vehicle.sale_price_kobo,
          amount_kobo: vehicle.sale_price_kobo,
        },
      ],
      subtotal_kobo: vehicle.sale_price_kobo,
      vat_exempt: true,
      vat_amount_kobo: 0,
      total_kobo: vehicle.sale_price_kobo,
    })
    .select("id")
    .single();

  if (vehicle.certification_status === "certified") {
    const { data: policy } = await supabase
      .from("warranty_policies")
      .select("id, reserve_contribution_kobo")
      .eq("vehicle_id", id)
      .eq("status", "active")
      .maybeSingle();

    if (policy) {
      await supabase.from("warranty_reserve_ledger").insert({
        entry_type: "accrual",
        amount_kobo: policy.reserve_contribution_kobo,
        related_policy_id: policy.id,
        note: `Accrued on sale of vehicle ${id}`,
      });
    }
  }

  const { data: buyer } = await supabase.from("customers").select("user_id, phone").eq("id", customerId).maybeSingle();
  await queueNotification({
    recipientId: buyer?.user_id ?? null,
    recipientPhone: buyer?.phone ?? null,
    channel: "email",
    template: "sale_confirmed",
    payload: { vehicleDescription: description, invoiceId: invoice?.id ?? null },
  });

  return NextResponse.json({
    ok: true,
    consignmentPayoutKobo: updates.consignment_payout_kobo ?? null,
    invoiceId: invoice?.id ?? null,
  });
}
