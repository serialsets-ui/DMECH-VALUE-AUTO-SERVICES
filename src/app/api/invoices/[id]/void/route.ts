import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

// Soft-delete for an invoice -- see migration 017's comment for why this
// isn't a real DELETE. Allowed any time before NRS transmission, not just
// before payment -- being paid doesn't "seal" a document, actually being
// transmitted does (see the edit route's identical comment). Once
// fetch_transmission_status is 'Sent', a real correction would be a credit
// note, which this project doesn't have yet.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to void invoices." }, { status: 403 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: invoice } = await service.from("invoices").select("doc_type, voided_at, fetch_transmission_status").eq("id", id).maybeSingle();
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.doc_type !== "invoice") {
    return NextResponse.json({ error: "Only an invoice can be voided, not a receipt." }, { status: 400 });
  }
  if (invoice.voided_at) {
    return NextResponse.json({ error: "Already voided." }, { status: 400 });
  }
  if (invoice.fetch_transmission_status === "Sent") {
    return NextResponse.json({ error: "Can't void an invoice already transmitted to NRS." }, { status: 400 });
  }

  const { error } = await service.from("invoices").update({ voided_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not void the invoice." }, { status: 500 });
  }

  await logAudit({ userId: staff.id, action: "void", tableName: "invoices", recordId: id });

  return NextResponse.json({ ok: true });
}
