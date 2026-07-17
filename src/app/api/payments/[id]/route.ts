import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { queueNotification } from "@/lib/notifications";
import { formatNaira } from "@/lib/money";
import type { PaymentMethod, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

// Records money actually received against a scheduled payment, then
// generates a receipt for THAT INCREMENT in the same step (mirrors how
// selling a vehicle generates its sale invoice — see
// api/vehicles/[id]/sell/route.ts). service-role: payments has no staff
// UPDATE RLS policy (only SELECT).
//
// amount_received_kobo is new money handed over just now, NOT a running
// total -- a payment settled across two visits (partial today, remainder
// later) generates two receipts, one per actual cash-in event. This
// replaced an earlier version that treated the submitted amount as an
// absolute snapshot: a top-up completing an already-partial payment would
// silently get no receipt at all, because a receipt already existed for
// that payment_id from the first partial amount.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to record payments." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const incrementKobo = Math.round(Number(body?.amount_received_kobo));
  const paymentMethod: PaymentMethod | null = ["bank_transfer", "paystack", "pos", "cash"].includes(body?.payment_method)
    ? body.payment_method
    : null;
  const paidDate = typeof body?.paid_date === "string" && body.paid_date ? body.paid_date : new Date().toISOString().slice(0, 10);

  if (!incrementKobo || incrementKobo <= 0) {
    return NextResponse.json({ error: "Enter the amount actually received." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: payment } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const newCumulativeKobo = (payment.amount_paid_kobo ?? 0) + incrementKobo;
  const status = newCumulativeKobo >= payment.amount_kobo ? "paid" : "partial";

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({ status, payment_method: paymentMethod, paid_date: paidDate, amount_paid_kobo: newCumulativeKobo })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Could not record the payment." }, { status: 500 });
  }

  // vehicles!vehicle_id — instalments has two FK paths to vehicles (this
  // one, plus vehicles.trade_in_applied_to_instalment_id pointing back), so
  // an unqualified embed returns PostgREST 300 Multiple Choices. Confirmed
  // live against the schema — the original unqualified version of this
  // query really does fail this way, not just in theory.
  const { data: instalment } = await supabase
    .from("instalments")
    .select("vehicle_id, vehicles!vehicle_id(make,model,year)")
    .eq("id", payment.instalment_id)
    .maybeSingle();
  const vehicleInfo = instalment?.vehicles as unknown as { make: string; model: string; year: number } | null;
  const description = vehicleInfo
    ? `Instalment payment #${payment.payment_number ?? "—"} — ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
    : `Instalment payment #${payment.payment_number ?? "—"}`;

  const { data: customer } = await supabase.from("customers").select("user_id, phone, tin").eq("id", payment.customer_id).maybeSingle();

  const { data: receipt } = await supabase
    .from("invoices")
    .insert({
      doc_type: "receipt",
      vehicle_id: instalment?.vehicle_id ?? null,
      customer_id: payment.customer_id,
      instalment_id: payment.instalment_id,
      payment_id: id,
      line_items: [{ description, quantity: 1, unit_price_kobo: incrementKobo, amount_kobo: incrementKobo }],
      subtotal_kobo: incrementKobo,
      vat_exempt: true,
      vat_amount_kobo: 0,
      total_kobo: incrementKobo,
      customer_tin: customer?.tin ?? null,
      invoice_type_code: customer?.tin ? "B2B" : "B2C",
      payment_means_code: "ZZZ",
      payment_method: paymentMethod,
      paid_date: paidDate,
    })
    .select("id")
    .single();
  const receiptId = receipt?.id ?? null;

  await queueNotification({
    recipientId: customer?.user_id ?? null,
    recipientPhone: customer?.phone ?? null,
    channel: "sms",
    template: "payment_received",
    payload: { amount: formatNaira(incrementKobo), paymentNumber: payment.payment_number, status, receiptId },
  });

  return NextResponse.json({ payment: updated, receiptId });
}
