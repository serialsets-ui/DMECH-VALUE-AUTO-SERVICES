import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { InvoiceForm } from "@/components/ops/InvoiceForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { fromKobo } from "@/lib/money";
import type { Invoice, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) redirect("/ops/invoices");

  const { id } = await params;
  const supabase = await createClient();

  const [invoiceRes, customersRes, vehiclesRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("customers")
      .select("id, full_name, tin")
      .is("deleted_at", null)
      .neq("type", "dealer_partner")
      .order("full_name"),
    supabase
      .from("vehicles")
      .select("id, make, model, year, sale_price_kobo")
      .is("deleted_at", null)
      .not("lifecycle_stage", "in", "(sold,delivered)")
      .order("make"),
  ]);

  if (!invoiceRes.data) notFound();
  const invoice = invoiceRes.data as Invoice;

  // Editable up until NRS transmission, not just until payment -- see
  // api/invoices/[id]/route.ts's comment for why.
  if (invoice.doc_type !== "invoice" || invoice.voided_at || invoice.fetch_transmission_status === "Sent") {
    redirect("/ops/invoices");
  }

  const editing = {
    id: invoice.id,
    customerId: invoice.customer_id ?? "",
    customerTin: invoice.customer_tin ?? "",
    vehicleId: invoice.vehicle_id ?? "",
    vatExempt: invoice.vat_exempt,
    notes: invoice.notes ?? "",
    items: invoice.line_items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPriceNaira: String(fromKobo(item.unit_price_kobo)),
      hsnCode: item.hsn_code ?? "",
    })),
  };

  return (
    <>
      <TopBar title="Edit Invoice" />
      <div className="ops-content">
        <InvoiceForm customers={customersRes.data ?? []} vehicles={vehiclesRes.data ?? []} editing={editing} />
      </div>
    </>
  );
}
