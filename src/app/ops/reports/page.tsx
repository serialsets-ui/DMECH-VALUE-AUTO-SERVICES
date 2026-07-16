import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/types";
import { stageLabel } from "@/lib/ops/vehicle-stage";

// Same fetch-then-reduce convention as the Dashboard and Reserve Fund report
// — no SQL views in this project, aggregates computed here instead.
export default async function ReportsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const [soldVehiclesRes, allVehiclesRes, paymentsRes, customersRes] = await Promise.all([
    supabase.from("vehicles").select("sale_price_kobo").in("lifecycle_stage", ["sold", "delivered"]).is("deleted_at", null),
    supabase.from("vehicles").select("lifecycle_stage").is("deleted_at", null),
    supabase.from("payments").select("amount_kobo, amount_paid_kobo, status"),
    supabase.from("customers").select("approval_status").is("deleted_at", null),
  ]);

  const soldVehicles = soldVehiclesRes.data ?? [];
  const totalRevenueKobo = soldVehicles.reduce((sum, v) => sum + (v.sale_price_kobo ?? 0), 0);

  const stageCounts = new Map<LifecycleStage, number>();
  for (const v of allVehiclesRes.data ?? []) {
    const stage = v.lifecycle_stage as LifecycleStage;
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const payments = paymentsRes.data ?? [];
  const totalDueKobo = payments.reduce((sum, p) => sum + p.amount_kobo, 0);
  const totalCollectedKobo = payments.reduce((sum, p) => sum + (p.amount_paid_kobo ?? 0), 0);
  const totalOverdueKobo = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount_kobo, 0);

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
            <div className="ops-stat-label">Total Revenue</div>
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

        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Inventory by Stage</div>
        <div className="ops-table-wrap" style={{ marginBottom: 24 }}>
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

        <div className="ops-panel-title" style={{ marginBottom: 12 }}>Customers by Status</div>
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
                  <td style={{ textTransform: "capitalize" }}>{statusKey}</td>
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
    </>
  );
}
