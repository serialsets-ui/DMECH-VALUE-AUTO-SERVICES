import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { ConsignmentPayoutAction } from "@/components/ops/ConsignmentPayoutAction";
import type { StaffRole } from "@/types";

const PAYOUT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant"];

type PayableRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  sale_price_kobo: number | null;
  consignment_payout_kobo: number | null;
  consignment_payout_paid_at: string | null;
  consignor_customer_id: string | null;
  customers: { full_name: string; type: string } | null;
};

// All consignment-sourced vehicles that have sold -- individual consignors
// and Dealer Partners alike, not scoped to a single dealer's own page.
export default async function ConsignmentPayablesPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, make, model, year, sale_price_kobo, consignment_payout_kobo, consignment_payout_paid_at, consignor_customer_id, customers!consignor_customer_id(full_name, type)"
    )
    .eq("acquisition_channel", "consignment")
    .not("consignment_payout_kobo", "is", null)
    .is("deleted_at", null)
    .order("consignment_payout_paid_at", { ascending: true, nullsFirst: true });

  const rows = (data as unknown as PayableRow[] | null) ?? [];
  const outstanding = rows.filter((r) => !r.consignment_payout_paid_at);
  const outstandingTotalKobo = outstanding.reduce((sum, r) => sum + (r.consignment_payout_kobo ?? 0), 0);
  const canManage = PAYOUT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar title="Consignment Payables" />
      <div className="ops-content">
        <div className="ops-stat-grid" style={{ marginBottom: 24 }}>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(outstandingTotalKobo)}</div>
            <div className="ops-stat-label">Outstanding Total</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{outstanding.length}</div>
            <div className="ops-stat-label">Vehicles Awaiting Payout</div>
          </div>
        </div>

        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Consignor</th>
                <th>Sale Price</th>
                <th>Payout Owed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/ops/vehicles/${r.id}`} style={{ color: "var(--blue)" }}>
                      {r.year} {r.make} {r.model}
                    </Link>
                  </td>
                  <td>
                    {r.consignor_customer_id ? (
                      <Link href={`/ops/dealer-partners/${r.consignor_customer_id}`} style={{ color: "var(--text)" }}>
                        {r.customers?.full_name ?? "—"}
                      </Link>
                    ) : (
                      r.customers?.full_name ?? "—"
                    )}
                  </td>
                  <td>{r.sale_price_kobo ? formatNaira(r.sale_price_kobo) : "—"}</td>
                  <td>{r.consignment_payout_kobo ? formatNaira(r.consignment_payout_kobo) : "—"}</td>
                  <td>
                    {canManage ? (
                      <ConsignmentPayoutAction vehicleId={r.id} paidAt={r.consignment_payout_paid_at} />
                    ) : (
                      <span className={`ops-badge ${r.consignment_payout_paid_at ? "ops-badge-green" : "ops-badge-amber"}`}>
                        {r.consignment_payout_paid_at ? "Paid" : "Unpaid"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>
                    No consignment sales yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
