import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
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

interface InvoiceRow {
  id: string;
  doc_type: "invoice" | "receipt";
  invoice_number: string;
  issue_date: string;
  total_kobo: number;
  vehicles: { make: string; model: string; year: number } | null;
  customers: { full_name: string } | null;
}

export default async function OpsInvoicesPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, doc_type, invoice_number, issue_date, total_kobo, vehicles(make,model,year), customers(full_name)")
    .order("created_at", { ascending: false });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const invoices = (data ?? []) as unknown as InvoiceRow[];

  return (
    <>
      <TopBar
        title="Invoices"
        actions={
          EDIT_ROLES.includes(staff.role as StaffRole) ? (
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.invoice_number}</td>
                    <td style={{ textTransform: "capitalize" }}>{inv.doc_type}</td>
                    <td>{inv.vehicles ? `${inv.vehicles.year} ${inv.vehicles.make} ${inv.vehicles.model}` : "—"}</td>
                    <td>{inv.customers?.full_name ?? "—"}</td>
                    <td>{formatNaira(inv.total_kobo)}</td>
                    <td>{new Date(inv.issue_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>
                      <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                        View PDF →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
