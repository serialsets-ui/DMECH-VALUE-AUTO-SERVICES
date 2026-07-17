import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { InvoiceDocType, InvoiceLineItem, StaffRole } from "@/types";

// Every staff role can raise an invoice -- this covers a car sale a sales
// rep is closing, a workshop job a workshop_lead just finished, or a parts
// sale, not just the roles that can Record Sale on the Vehicles module.
const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

const VAT_RATE = 7.5;

export async function POST(request: Request) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to create invoices." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const customerId = typeof body?.customer_id === "string" ? body.customer_id : "";
  const vehicleId = typeof body?.vehicle_id === "string" && body.vehicle_id ? body.vehicle_id : null;
  const docType: InvoiceDocType = body?.doc_type === "receipt" ? "receipt" : "invoice";
  const vatExempt = body?.vat_exempt !== false;
  const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

  const rawItems = Array.isArray(body?.line_items) ? body.line_items : [];
  const lineItems: InvoiceLineItem[] = rawItems
    .map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const description = typeof i.description === "string" ? i.description.trim() : "";
      const quantity = Number(i.quantity);
      const unitPriceKobo = Number(i.unit_price_kobo);
      if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPriceKobo) || unitPriceKobo < 0) {
        return null;
      }
      return { description, quantity, unit_price_kobo: unitPriceKobo, amount_kobo: Math.round(quantity * unitPriceKobo) };
    })
    .filter((item: InvoiceLineItem | null): item is InvoiceLineItem => item !== null);

  if (!customerId) {
    return NextResponse.json({ error: "Select a customer." }, { status: 400 });
  }
  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
  }

  const subtotalKobo = lineItems.reduce((sum, item) => sum + item.amount_kobo, 0);
  const vatAmountKobo = vatExempt ? 0 : Math.round(subtotalKobo * (VAT_RATE / 100));
  const totalKobo = subtotalKobo + vatAmountKobo;

  const service = createServiceClient();
  const { data: invoice, error } = await service
    .from("invoices")
    .insert({
      doc_type: docType,
      vehicle_id: vehicleId,
      customer_id: customerId,
      line_items: lineItems,
      subtotal_kobo: subtotalKobo,
      vat_rate: VAT_RATE,
      vat_exempt: vatExempt,
      vat_amount_kobo: vatAmountKobo,
      total_kobo: totalKobo,
      notes,
      created_by: staff.id,
    })
    .select("id, invoice_number")
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Could not create the invoice." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "create",
    tableName: "invoices",
    recordId: invoice.id,
    newValue: { invoice_number: invoice.invoice_number, customer_id: customerId, total_kobo: totalKobo },
  });

  return NextResponse.json({ id: invoice.id, invoiceNumber: invoice.invoice_number });
}
