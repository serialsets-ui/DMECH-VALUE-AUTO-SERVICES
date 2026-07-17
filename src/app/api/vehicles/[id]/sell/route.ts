import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { queueNotification } from "@/lib/notifications";
import type { PaymentMethod, StaffRole } from "@/types";

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
  const paidInFull = body?.paid_in_full === true;
  const paymentMethod: PaymentMethod | null = ["bank_transfer", "paystack", "pos", "cash"].includes(body?.payment_method)
    ? body.payment_method
    : null;
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
  const { data: buyer } = await supabase.from("customers").select("user_id, phone, tin").eq("id", customerId).maybeSingle();
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
          // 8703 — Harmonized System code for motor cars/passenger vehicles.
          hsn_code: "8703",
        },
      ],
      subtotal_kobo: vehicle.sale_price_kobo,
      vat_exempt: true,
      vat_amount_kobo: 0,
      total_kobo: vehicle.sale_price_kobo,
      customer_tin: buyer?.tin ?? null,
      invoice_type_code: buyer?.tin ? "B2B" : "B2C",
      payment_means_code: "ZZZ",
    })
    .select("id")
    .single();

  // Paid-in-full at the point of sale (a cash buyer, not instalment
  // financing) gets its own receipt alongside the invoice -- the invoice
  // documents what was billed, the receipt confirms it was actually paid.
  // related_invoice_id links it back so the invoice list can show "Paid".
  let receiptId: string | null = null;
  if (paidInFull && invoice?.id) {
    const { data: receipt } = await supabase
      .from("invoices")
      .insert({
        doc_type: "receipt",
        vehicle_id: id,
        customer_id: customerId,
        related_invoice_id: invoice.id,
        line_items: [
          {
            description,
            quantity: 1,
            unit_price_kobo: vehicle.sale_price_kobo,
            amount_kobo: vehicle.sale_price_kobo,
            hsn_code: "8703",
          },
        ],
        subtotal_kobo: vehicle.sale_price_kobo,
        vat_exempt: true,
        vat_amount_kobo: 0,
        total_kobo: vehicle.sale_price_kobo,
        customer_tin: buyer?.tin ?? null,
        invoice_type_code: buyer?.tin ? "B2B" : "B2C",
        payment_means_code: "ZZZ",
        payment_method: paymentMethod,
        paid_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    receiptId = receipt?.id ?? null;
  }

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

  await queueNotification({
    recipientId: buyer?.user_id ?? null,
    recipientPhone: buyer?.phone ?? null,
    channel: "email",
    template: "sale_confirmed",
    payload: { vehicleDescription: description, invoiceId: invoice?.id ?? null, receiptId },
  });

  return NextResponse.json({
    ok: true,
    consignmentPayoutKobo: updates.consignment_payout_kobo ?? null,
    invoiceId: invoice?.id ?? null,
    receiptId,
  });
}
