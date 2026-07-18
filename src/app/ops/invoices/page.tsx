import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
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
  invoice_number: string;
  issue_date: string;
  total_kobo: number;
  instalment_id: string | null;
  related_invoice_id: string | null;
  payment_method: PaymentMethod | null;
  voided_at: string | null;
  vehicles: { make: string; model: string; year: number } | null;
  customers: { full_name: string } | null;
}

// Only invoices (bills) live here now -- receipts (proof of payment) have
// their own page, /ops/receipts. Instalments and the standalone Payments
// list are gone too: an instalment-financed sale now always has a master
// invoice (see api/instalments/route.ts), and its payment schedule/history
// lives on that invoice's own detail page instead of a separate module.
export default async function OpsInvoicesPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, issue_date, total_kobo, instalment_id, related_invoice_id, payment_method, voided_at, vehicles(make,model,year), customers(full_name)",
    )
    .eq("doc_type", "invoice")
    .order("created_at", { ascending: false });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const invoices = (data ?? []) as unknown as InvoiceRow[];
  const canManage = EDIT_ROLES.includes(staff.role as StaffRole);

  // Which of these (non-instalment) invoices already have a receipt.
  const relatedIds = invoices.filter((inv) => !inv.instalment_id).map((inv) => inv.id);
  const paidInvoiceIds = new Set<string>();
  if (relatedIds.length > 0) {
    const { data: receipts } = await supabase
      .from("invoices")
      .select("related_invoice_id")
      .in("related_invoice_id", relatedIds);
    for (const r of receipts ?? []) {
      if (r.related_invoice_id) paidInvoiceIds.add(r.related_invoice_id);
    }
  }

  return (
    <>
      <TopBar
        title="Invoices"
        actions={
          canManage ? (
            <span style={{ display: "flex", gap: 10 }}>
              <Link href="/ops/instalments/new" className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)", textDecoration: "none" }}>
                + New Instalment Plan
              </Link>
              <Link href="/ops/invoices/new" className="ops-btn" style={{ textDecoration: "none" }}>
                + New Invoice
              </Link>
            </span>
          ) : undefined
        }
      />
      <div className="ops-content">
        {invoices.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No invoices yet — one is generated automatically for every vehicle sale and instalment
            plan, or create one directly above for a workshop job or parts order.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isPaid = paidInvoiceIds.has(inv.id);
                  return (
                    <ClickableRow key={inv.id} href={`/ops/invoices/${inv.id}`}>
                      <td>{inv.invoice_number}</td>
                      <td>{inv.vehicles ? `${inv.vehicles.year} ${inv.vehicles.make} ${inv.vehicles.model}` : "—"}</td>
                      <td>{inv.customers?.full_name ?? "—"}</td>
                      <td>{formatNaira(inv.total_kobo)}</td>
                      <td>{new Date(inv.issue_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td>
                        {inv.voided_at ? (
                          <span className="ops-badge ops-badge-muted">Voided</span>
                        ) : inv.instalment_id ? (
                          <span className="ops-badge ops-badge-blue">Financed</span>
                        ) : isPaid ? (
                          <span className="ops-badge ops-badge-green">
                            Paid{inv.payment_method ? ` — ${PAYMENT_METHOD_LABEL[inv.payment_method]}` : ""}
                          </span>
                        ) : (
                          <span className="ops-badge ops-badge-amber">Unpaid</span>
                        )}
                      </td>
                    </ClickableRow>
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
