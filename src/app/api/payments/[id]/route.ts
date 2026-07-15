import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { PaymentMethod, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

// Records money actually received against a scheduled payment, then
// generates its receipt in the same step (mirrors how selling a vehicle
// generates its sale invoice — see api/vehicles/[id]/sell/route.ts).
// service-role: payments has no staff UPDATE RLS policy (only SELECT).
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
  const amountPaidKobo = Math.round(Number(body?.amount_paid_kobo));
  const paymentMethod: PaymentMethod | null = ["bank_transfer", "paystack", "pos", "cash"].includes(body?.payment_method)
    ? body.payment_method
    : null;
  const paidDate = typeof body?.paid_date === "string" && body.paid_date ? body.paid_date : new Date().toISOString().slice(0, 10);

  if (!amountPaidKobo || amountPaidKobo <= 0) {
    return NextResponse.json({ error: "Enter the amount actually received." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: payment } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const status = amountPaidKobo >= payment.amount_kobo ? "paid" : "partial";

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({ status, payment_method: paymentMethod, paid_date: paidDate, amount_paid_kobo: amountPaidKobo })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Could not record the payment." }, { status: 500 });
  }

  // One receipt per payment — a correction to an already-receipted payment
  // (e.g. fixing the payment method afterwards) doesn't re-issue one.
  const { data: existingReceipt } = await supabase.from("invoices").select("id").eq("payment_id", id).maybeSingle();

  let receiptId: string | null = existingReceipt?.id ?? null;
  if (!existingReceipt) {
    const { data: instalment } = await supabase
      .from("instalments")
      .select("vehicle_id, vehicles(make,model,year)")
      .eq("id", payment.instalment_id)
      .maybeSingle();
    const vehicleInfo = instalment?.vehicles as unknown as { make: string; model: string; year: number } | null;
    const description = vehicleInfo
      ? `Instalment payment #${payment.payment_number ?? "—"} — ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
      : `Instalment payment #${payment.payment_number ?? "—"}`;

    const { data: receipt } = await supabase
      .from("invoices")
      .insert({
        doc_type: "receipt",
        vehicle_id: instalment?.vehicle_id ?? null,
        customer_id: payment.customer_id,
        instalment_id: payment.instalment_id,
        payment_id: id,
        line_items: [{ description, quantity: 1, unit_price_kobo: amountPaidKobo, amount_kobo: amountPaidKobo }],
        subtotal_kobo: amountPaidKobo,
        vat_exempt: true,
        vat_amount_kobo: 0,
        total_kobo: amountPaidKobo,
      })
      .select("id")
      .single();
    receiptId = receipt?.id ?? null;
  }

  return NextResponse.json({ payment: updated, receiptId });
}
