import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/types";
import { stageLabel } from "@/lib/ops/vehicle-stage";
import { HorizontalBarChart, DonutChart, CHART_PALETTE } from "@/components/ops/charts";

const CUSTOMER_STATUS_COLOR: Record<string, string> = {
  pending: "--amber",
  stage2_docs: "--blue",
  approved: "--green",
  declined: "--red",
};

const CUSTOMER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  stage2_docs: "Stage 2 Docs",
  approved: "Approved",
  declined: "Declined",
};

// Same fetch-then-reduce convention as the Dashboard and Reserve Fund report
// — no SQL views in this project, aggregates computed here instead.
export default async function ReportsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const [soldVehiclesRes, allVehiclesRes, paymentsRes, customersRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("sale_price_kobo, consignment_payout_kobo, consignment_payout_paid_at")
      .in("lifecycle_stage", ["sold", "delivered"])
      .is("deleted_at", null),
    supabase.from("vehicles").select("lifecycle_stage").is("deleted_at", null),
    supabase.from("payments").select("amount_kobo, amount_paid_kobo, status"),
    supabase.from("customers").select("approval_status").is("deleted_at", null),
  ]);

  const soldVehicles = soldVehiclesRes.data ?? [];
  const totalRevenueKobo = soldVehicles.reduce((sum, v) => sum + (v.sale_price_kobo ?? 0), 0);
  // Consignment payouts were never DMECH's money -- net revenue backs them out
  // regardless of whether they've actually been paid to the consignor yet.
  const totalPayoutsKobo = soldVehicles.reduce((sum, v) => sum + (v.consignment_payout_kobo ?? 0), 0);
  const outstandingPayoutsKobo = soldVehicles
    .filter((v) => v.consignment_payout_kobo != null && !v.consignment_payout_paid_at)
    .reduce((sum, v) => sum + (v.consignment_payout_kobo ?? 0), 0);
  const netRevenueKobo = totalRevenueKobo - totalPayoutsKobo;

  const stageCounts = new Map<LifecycleStage, number>();
  for (const v of allVehiclesRes.data ?? []) {
    const stage = v.lifecycle_stage as LifecycleStage;
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const payments = paymentsRes.data ?? [];
  const totalDueKobo = payments.reduce((sum, p) => sum + p.amount_kobo, 0);
  const totalCollectedKobo = payments.reduce((sum, p) => sum + (p.amount_paid_kobo ?? 0), 0);
  const totalOverdueKobo = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount_kobo, 0);
  // Illustrative split for the donut only -- the three stat cards above stay
  // the exact source of truth; "remaining" here is a rough not-yet-collected,
  // not-yet-overdue bucket, not a maintained ledger figure.
  const remainingKobo = Math.max(0, totalDueKobo - totalCollectedKobo - totalOverdueKobo);

  const customerStatusCounts = new Map<string, number>();
  for (const c of customersRes.data ?? []) {
    customerStatusCounts.set(c.approval_status, (customerStatusCounts.get(c.approval_status) ?? 0) + 1);
  }

  return (
    <>
      <TopBar title="Reports" />
      <div className="ops-content">
        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Sales</div>
        <div className="ops-stat-grid" style={{ marginBottom: 24 }}>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{soldVehicles.length}</div>
            <div className="ops-stat-label">Vehicles Sold</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalRevenueKobo)}</div>
            <div className="ops-stat-label">Gross Revenue</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(netRevenueKobo)}</div>
            <div className="ops-stat-label">Net Revenue (after payouts)</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(outstandingPayoutsKobo)}</div>
            <div className="ops-stat-label">Outstanding Consignment Payables</div>
          </div>
        </div>

        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Collections</div>
        <div className="ops-stat-grid" style={{ marginBottom: 24 }}>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalDueKobo)}</div>
            <div className="ops-stat-label">Total Scheduled</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalCollectedKobo)}</div>
            <div className="ops-stat-label">Total Collected</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(totalOverdueKobo)}</div>
            <div className="ops-stat-label">Overdue</div>
          </div>
        </div>
        {totalDueKobo > 0 && (
          <div className="ops-panel" style={{ marginBottom: 24 }}>
            <DonutChart
              data={[
                { label: "Collected", value: totalCollectedKobo, colorVar: "--green" },
                { label: "Overdue", value: totalOverdueKobo, colorVar: "--red" },
                { label: "Remaining", value: remainingKobo, colorVar: "--blue" },
              ]}
              formatValue={formatNaira}
              centerLabel={formatNaira(totalDueKobo)}
            />
          </div>
        )}

        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Inventory by Stage</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="ops-panel">
            <HorizontalBarChart
              data={LIFECYCLE_STAGES.filter((s) => (stageCounts.get(s) ?? 0) > 0).map((s, i) => ({
                label: stageLabel(s),
                value: stageCounts.get(s) ?? 0,
                colorVar: CHART_PALETTE[i % CHART_PALETTE.length],
              }))}
            />
          </div>
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {LIFECYCLE_STAGES.filter((s) => (stageCounts.get(s) ?? 0) > 0).map((s) => (
                  <tr key={s}>
                    <td>{stageLabel(s)}</td>
                    <td>{stageCounts.get(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Customers by Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {customerStatusCounts.size > 0 && (
            <div className="ops-panel">
              <DonutChart
                data={[...customerStatusCounts.entries()].map(([statusKey, count]) => ({
                  label: CUSTOMER_STATUS_LABEL[statusKey] ?? statusKey,
                  value: count,
                  colorVar: CUSTOMER_STATUS_COLOR[statusKey] ?? "--subtle",
                }))}
              />
            </div>
          )}
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {[...customerStatusCounts.entries()].map(([statusKey, count]) => (
                  <tr key={statusKey}>
                    <td style={{ textTransform: "capitalize" }}>{CUSTOMER_STATUS_LABEL[statusKey] ?? statusKey}</td>
                    <td>{count}</td>
                  </tr>
                ))}
                {customerStatusCounts.size === 0 && (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--muted)" }}>No customers registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
