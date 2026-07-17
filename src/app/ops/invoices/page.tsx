import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { MarkInvoicePaidAction } from "@/components/ops/MarkInvoicePaidAction";
import { VoidInvoiceAction } from "@/components/ops/VoidInvoiceAction";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
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

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  paystack: "Paystack",
  pos: "POS",
  cash: "Cash",
};

interface InvoiceRow {
  id: string;
  doc_type: "invoice" | "receipt";
  invoice_number: string;
  issue_date: string;
  total_kobo: number;
  related_invoice_id: string | null;
  payment_method: PaymentMethod | null;
  paid_date: string | null;
  voided_at: string | null;
  vehicles: { make: string; model: string; year: number } | null;
  customers: { full_name: string } | null;
}

export default async function OpsInvoicesPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, doc_type, invoice_number, issue_date, total_kobo, related_invoice_id, payment_method, paid_date, voided_at, vehicles(make,model,year), customers(full_name)",
    )
    .order("created_at", { ascending: false });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const invoices = (data ?? []) as unknown as InvoiceRow[];
  const canManage = EDIT_ROLES.includes(staff.role as StaffRole);
  // Which invoice ids already have a receipt generated against them, and
  // that receipt's own payment details -- so the list shows how/when an
  // invoice was actually paid without a click through to the PDF.
  const receiptByInvoiceId = new Map(
    invoices
      .filter((inv) => inv.related_invoice_id)
      .map((inv) => [inv.related_invoice_id as string, inv]),
  );

  return (
    <>
      <TopBar
        title="Invoices"
        actions={
          canManage ? (
            <Link href="/ops/invoices/new" className="ops-btn" style={{ textDecoration: "none" }}>
              + New Invoice
            </Link>
          ) : undefined
        }
      />
      <div className="ops-content">
        {invoices.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No invoices yet — one is generated automatically for every vehicle sale and payment
            received, or create one directly above for a car sale, workshop job, or parts order.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const receipt = receiptByInvoiceId.get(inv.id) ?? null;
                  const isEditable = inv.doc_type === "invoice" && !inv.voided_at && !receipt;
                  return (
                    <tr key={inv.id} style={inv.voided_at ? { opacity: 0.55 } : undefined}>
                      <td>{inv.invoice_number}</td>
                      <td style={{ textTransform: "capitalize" }}>{inv.doc_type}</td>
                      <td>{inv.vehicles ? `${inv.vehicles.year} ${inv.vehicles.make} ${inv.vehicles.model}` : "—"}</td>
                      <td>{inv.customers?.full_name ?? "—"}</td>
                      <td>{formatNaira(inv.total_kobo)}</td>
                      <td>{new Date(inv.issue_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td>
                        {inv.voided_at ? (
                          <span className="ops-badge ops-badge-muted">Voided</span>
                        ) : inv.doc_type === "receipt" ? (
                          <span className="ops-badge ops-badge-green">
                            Paid{inv.payment_method ? ` — ${PAYMENT_METHOD_LABEL[inv.payment_method]}` : ""}
                          </span>
                        ) : receipt ? (
                          <a href={`/api/invoices/${receipt.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
                            <span className="ops-badge ops-badge-green">
                              Paid{receipt.payment_method ? ` — ${PAYMENT_METHOD_LABEL[receipt.payment_method]}` : ""}
                              {receipt.paid_date ? ` (${new Date(receipt.paid_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })})` : ""}
                            </span>
                          </a>
                        ) : canManage ? (
                          <MarkInvoicePaidAction invoiceId={inv.id} />
                        ) : (
                          <span className="ops-badge ops-badge-amber">Unpaid</span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                            View PDF →
                          </a>
                          {canManage && isEditable && (
                            <>
                              <Link href={`/ops/invoices/${inv.id}/edit`} style={{ color: "var(--blue)", fontSize: 12 }}>
                                Edit
                              </Link>
                              <VoidInvoiceAction invoiceId={inv.id} />
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
