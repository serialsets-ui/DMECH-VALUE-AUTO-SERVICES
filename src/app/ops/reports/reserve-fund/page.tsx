import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { WarrantyReserveLedgerEntry } from "@/types";

interface MonthRow {
  month: string;
  accrued: number;
  paidOut: number;
}

export default async function ReserveFundReportPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("warranty_reserve_ledger")
    .select("*")
    .order("created_at", { ascending: true });

  const entries = (data as WarrantyReserveLedgerEntry[] | null) ?? [];

  const totalBalance = entries.reduce((sum, e) => sum + e.amount_kobo, 0);
  const totalAccrued = entries
    .filter((e) => e.entry_type === "accrual")
    .reduce((sum, e) => sum + e.amount_kobo, 0);
  const totalPaidOut = entries
    .filter((e) => e.entry_type === "claim_payout")
    .reduce((sum, e) => sum + Math.abs(e.amount_kobo), 0);

  const byMonth = new Map<string, MonthRow>();
  for (const e of entries) {
    const month = new Date(e.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
    const row = byMonth.get(month) ?? { month, accrued: 0, paidOut: 0 };
    if (e.entry_type === "accrual") row.accrued += e.amount_kobo;
    if (e.entry_type === "claim_payout") row.paidOut += Math.abs(e.amount_kobo);
    byMonth.set(month, row);
  }

  return (
    <>
      <TopBar title="Reserve Fund" />
      <div className="ops-content">
        <div className="ops-stat-grid" style={{ marginBottom: 24 }}>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalBalance)}</div>
            <div className="ops-stat-label">Current Balance</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalAccrued)}</div>
            <div className="ops-stat-label">Total Accrued</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalPaidOut)}</div>
            <div className="ops-stat-label">Total Paid Out</div>
          </div>
        </div>

        {byMonth.size === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No reserve fund activity yet — this fills in as certified vehicles sell.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Accrued</th>
                  <th>Paid Out</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {[...byMonth.values()].map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatNaira(row.accrued)}</td>
                    <td>{formatNaira(row.paidOut)}</td>
                    <td>{formatNaira(row.accrued - row.paidOut)}</td>
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
