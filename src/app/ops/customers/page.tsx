import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { CUSTOMER_TYPE_LABELS } from "@/types";
import type { ApprovalStatus, Customer, StaffRole } from "@/types";

const STATUS_CLASS: Record<ApprovalStatus, string> = {
  pending: "ops-badge-amber",
  stage2_docs: "ops-badge-blue",
  approved: "ops-badge-green",
  declined: "ops-badge-muted",
};

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "sales_rep", "accountant"];

export default async function OpsCustomersPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const customers = (data as Customer[] | null) ?? [];

  return (
    <>
      <TopBar
        title="Customers"
        actions={
          EDIT_ROLES.includes(staff.role as StaffRole) ? (
            <Link href="/ops/customers/new" className="ops-btn" style={{ textDecoration: "none" }}>
              + Add Customer
            </Link>
          ) : undefined
        }
      />
      <div className="ops-content">
        {customers.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No customers registered yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Requested Credit</th>
                  <th>Tier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <ClickableRow key={c.id} href={`/ops/customers/${c.id}`}>
                    <td>{c.full_name}</td>
                    <td>{CUSTOMER_TYPE_LABELS[c.type]}</td>
                    <td>{c.phone}</td>
                    <td>{c.credit_limit_kobo ? formatNaira(c.credit_limit_kobo) : "—"}</td>
                    <td>{c.approval_tier ?? "—"}</td>
                    <td>
                      <span className={`ops-badge ${STATUS_CLASS[c.approval_status]}`}>{c.approval_status}</span>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
