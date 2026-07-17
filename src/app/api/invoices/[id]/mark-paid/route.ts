import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { PaymentMethod, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

// Generates the matching receipt for a manually-created invoice (see
// api/invoices/route.ts) -- the same "invoice bills, receipt confirms
// payment" split used at Record Sale and Instalment Intake, just for the
// one creation path that has no vehicle-sale/payment-schedule row to hang
// this off of.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to mark invoices paid." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const paymentMethod: PaymentMethod | null = ["bank_transfer", "paystack", "pos", "cash"].includes(body?.payment_method)
    ? body.payment_method
    : null;
  const paidDate = typeof body?.paid_date === "string" && body.paid_date ? body.paid_date : new Date().toISOString().slice(0, 10);

  const { id } = await params;
  const service = createServiceClient();

  const { data: invoice } = await service.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.doc_type !== "invoice") {
    return NextResponse.json({ error: "Only an invoice can be marked paid." }, { status: 400 });
  }

  const { data: existingReceipt } = await service
    .from("invoices")
    .select("id")
    .eq("related_invoice_id", id)
    .maybeSingle();
  if (existingReceipt) {
    return NextResponse.json({ receiptId: existingReceipt.id });
  }

  const { data: receipt, error } = await service
    .from("invoices")
    .insert({
      doc_type: "receipt",
      vehicle_id: invoice.vehicle_id,
      customer_id: invoice.customer_id,
      related_invoice_id: id,
      line_items: invoice.line_items,
      subtotal_kobo: invoice.subtotal_kobo,
      vat_rate: invoice.vat_rate,
      vat_exempt: invoice.vat_exempt,
      vat_amount_kobo: invoice.vat_amount_kobo,
      total_kobo: invoice.total_kobo,
      customer_tin: invoice.customer_tin,
      invoice_type_code: invoice.invoice_type_code,
      payment_means_code: invoice.payment_means_code,
      payment_method: paymentMethod,
      paid_date: paidDate,
    })
    .select("id")
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Could not generate the receipt." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "create",
    tableName: "invoices",
    recordId: receipt.id,
    newValue: { doc_type: "receipt", related_invoice_id: id, total_kobo: invoice.total_kobo },
  });

  return NextResponse.json({ receiptId: receipt.id });
}
