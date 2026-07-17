import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { InstalmentPlanType, PaymentMethod, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

// Creates the instalment plan and its full monthly payment schedule in one
// step — nothing else in this project creates either, so an instalment
// couldn't previously exist without a manual DB insert. total_price_kobo is
// always read from the vehicle server-side, never trusted from the client.
export async function POST(request: Request) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to create instalment plans." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const vehicleId = typeof body?.vehicle_id === "string" ? body.vehicle_id : "";
  const customerId = typeof body?.customer_id === "string" ? body.customer_id : "";
  const planType: InstalmentPlanType = body?.plan_type === "partner_finance" ? "partner_finance" : "dmech_direct";
  const depositPct = Number(body?.deposit_pct);
  const tenorMonths = Math.round(Number(body?.tenor_months));
  const adminFeePct = body?.admin_fee_pct != null ? Number(body.admin_fee_pct) : null;
  const depositPaid = Boolean(body?.deposit_paid);
  const depositPaymentMethod: PaymentMethod | null = ["bank_transfer", "paystack", "pos", "cash"].includes(body?.deposit_payment_method)
    ? body.deposit_payment_method
    : null;

  if (!vehicleId || !customerId || !depositPct || !tenorMonths || tenorMonths < 1) {
    return NextResponse.json(
      { error: "Vehicle, customer, deposit %, and tenor (months) are required." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: vehicle } = await supabase.from("vehicles").select("make, model, year, vin, sale_price_kobo").eq("id", vehicleId).maybeSingle();
  if (!vehicle?.sale_price_kobo) {
    return NextResponse.json({ error: "This vehicle has no sale price set yet." }, { status: 400 });
  }

  const totalPriceKobo = vehicle.sale_price_kobo;
  const depositAmountKobo = Math.round((totalPriceKobo * depositPct) / 100);
  const financedKobo = totalPriceKobo - depositAmountKobo;
  const monthlyAmountKobo = Math.round(financedKobo / tenorMonths);

  const { data: instalment, error: instalmentError } = await supabase
    .from("instalments")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      plan_type: planType,
      total_price_kobo: totalPriceKobo,
      deposit_pct: depositPct,
      deposit_amount_kobo: depositAmountKobo,
      deposit_paid: depositPaid,
      deposit_paid_at: depositPaid ? new Date().toISOString() : null,
      tenor_months: tenorMonths,
      monthly_amount_kobo: monthlyAmountKobo,
      admin_fee_pct: planType === "dmech_direct" ? adminFeePct : null,
      status: "active",
    })
    .select("id")
    .single();

  if (instalmentError || !instalment) {
    return NextResponse.json({ error: "Could not create the instalment plan." }, { status: 500 });
  }

  // Even split across the schedule, with any rounding remainder folded into
  // the final payment so the sum always reconciles exactly to financedKobo.
  const scheduled = monthlyAmountKobo * tenorMonths;
  const remainder = financedKobo - scheduled;
  const today = new Date();
  const paymentRows = Array.from({ length: tenorMonths }, (_, i) => {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return {
      instalment_id: instalment.id,
      customer_id: customerId,
      amount_kobo: monthlyAmountKobo + (i === tenorMonths - 1 ? remainder : 0),
      payment_number: i + 1,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "pending" as const,
    };
  });

  const { error: paymentsError } = await supabase.from("payments").insert(paymentRows);
  if (paymentsError) {
    return NextResponse.json(
      { error: "Instalment created, but the payment schedule failed to generate." },
      { status: 500 },
    );
  }

  // Deposit receipt -- distinguished from a regular instalment-payment
  // receipt by having instalment_id set but payment_id null (there's no
  // `payments` row for a deposit, it's collected at intake, not scheduled).
  let depositReceiptId: string | null = null;
  if (depositPaid && depositAmountKobo > 0) {
    const description = `Deposit — ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.vin ? ` (VIN: ${vehicle.vin})` : ""}`;
    const { data: customer } = await supabase.from("customers").select("tin").eq("id", customerId).maybeSingle();
    const { data: receipt } = await supabase
      .from("invoices")
      .insert({
        doc_type: "receipt",
        vehicle_id: vehicleId,
        customer_id: customerId,
        instalment_id: instalment.id,
        line_items: [{ description, quantity: 1, unit_price_kobo: depositAmountKobo, amount_kobo: depositAmountKobo }],
        subtotal_kobo: depositAmountKobo,
        vat_exempt: true,
        vat_amount_kobo: 0,
        total_kobo: depositAmountKobo,
        customer_tin: customer?.tin ?? null,
        invoice_type_code: customer?.tin ? "B2B" : "B2C",
        payment_means_code: "ZZZ",
        payment_method: depositPaymentMethod,
        paid_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    depositReceiptId = receipt?.id ?? null;
  }

  return NextResponse.json({ instalment, depositReceiptId });
}
