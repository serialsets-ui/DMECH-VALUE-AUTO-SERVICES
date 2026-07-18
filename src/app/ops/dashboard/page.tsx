import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { HorizontalBarChart } from "@/components/ops/charts";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/types";
import { stageLabel } from "@/lib/ops/vehicle-stage";

const STATUS_CLASS: Record<string, string> = {
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

const PIPELINE_STAGES = ["shipped", "in_transit", "at_port", "customs", "cleared"];

interface RecentLead {
  phone: string;
  source: string;
  created_at: string;
}

interface UpcomingPayment {
  id: string;
  instalment_id: string;
  amount_kobo: number;
  due_date: string;
  status: string;
  invoiceId: string | null;
  customers: { full_name: string } | null;
}

interface DashboardData {
  totalVehicles: number;
  availableVehicles: number;
  pipelineVehicles: number;
  certifiedVehicles: number;
  activeInstalments: number;
  totalFinancedKobo: number;
  recentLeads: RecentLead[];
  upcomingPayments: UpcomingPayment[];
  stageCounts: Map<LifecycleStage, number>;
}

const EMPTY_DASHBOARD: DashboardData = {
  totalVehicles: 0,
  availableVehicles: 0,
  pipelineVehicles: 0,
  certifiedVehicles: 0,
  activeInstalments: 0,
  totalFinancedKobo: 0,
  recentLeads: [],
  upcomingPayments: [],
  stageCounts: new Map(),
};

// Same fail-soft convention as getPublicVehicles() on the marketing site —
// a missing table/RLS policy degrades to zeroed cards, never a crashed page,
// since this is the first thing staff see after logging in.
async function getDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createClient();

    const [
      totalVehicles,
      availableVehicles,
      pipelineVehicles,
      certifiedVehicles,
      activeInstalments,
      instalmentTotals,
      recentLeads,
      upcomingPayments,
      stageRows,
    ] = await Promise.all([
      supabase.from("vehicles").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("lifecycle_stage", "available"),
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("lifecycle_stage", PIPELINE_STAGES),
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("certification_status", "certified"),
      supabase.from("instalments").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("instalments").select("total_price_kobo").eq("status", "active"),
      supabase
        .from("leads")
        .select("phone, source, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      // Cross-customer "what's due soon" visibility -- the standalone
      // Payments list this replaced was the only place staff could see this
      // across every instalment at once; this panel is where that lives now.
      supabase
        .from("payments")
        .select("id, instalment_id, amount_kobo, due_date, status, customers(full_name)")
        .in("status", ["pending", "overdue", "partial"])
        .order("due_date", { ascending: true })
        .limit(8),
      // Same fetch-then-reduce idiom as Business Reports' "Inventory by
      // Stage" table -- reused here so the Dashboard gets a chart view of
      // the identical breakdown, not a second source of truth for it.
      supabase.from("vehicles").select("lifecycle_stage").is("deleted_at", null),
    ]);

    const totalFinancedKobo = (instalmentTotals.data ?? []).reduce(
      (sum, row) => sum + (row.total_price_kobo ?? 0),
      0,
    );

    const rawUpcomingPayments = (upcomingPayments.data as unknown as UpcomingPayment[] | null) ?? [];
    const instalmentIds = [...new Set(rawUpcomingPayments.map((p) => p.instalment_id))];
    const invoiceIdByInstalmentId = new Map<string, string>();
    if (instalmentIds.length > 0) {
      const { data: masterInvoices } = await supabase
        .from("invoices")
        .select("id, instalment_id")
        .eq("doc_type", "invoice")
        .in("instalment_id", instalmentIds);
      for (const inv of masterInvoices ?? []) {
        if (inv.instalment_id) invoiceIdByInstalmentId.set(inv.instalment_id, inv.id);
      }
    }

    const stageCounts = new Map<LifecycleStage, number>();
    for (const row of stageRows.data ?? []) {
      const stage = row.lifecycle_stage as LifecycleStage;
      stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
    }

    return {
      totalVehicles: totalVehicles.count ?? 0,
      availableVehicles: availableVehicles.count ?? 0,
      pipelineVehicles: pipelineVehicles.count ?? 0,
      certifiedVehicles: certifiedVehicles.count ?? 0,
      activeInstalments: activeInstalments.count ?? 0,
      totalFinancedKobo,
      recentLeads: (recentLeads.data as RecentLead[] | null) ?? [],
      upcomingPayments: rawUpcomingPayments.map((p) => ({
        ...p,
        invoiceId: invoiceIdByInstalmentId.get(p.instalment_id) ?? null,
      })),
      stageCounts,
    };
  } catch {
    return EMPTY_DASHBOARD;
  }
}

export default async function OpsDashboard() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const data = await getDashboardData();
  const firstName = staff.full_name.split(" ")[0];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="ops-content">
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Welcome back, {firstName}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            Here&apos;s what&apos;s happening across DMECH today.
          </div>
        </div>

        <div className="ops-stat-grid">
          <div className="ops-stat-card">
            <div className="ops-stat-value">{data.totalVehicles}</div>
            <div className="ops-stat-label">Total Vehicles</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{data.availableVehicles}</div>
            <div className="ops-stat-label">Available Now</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{data.pipelineVehicles}</div>
            <div className="ops-stat-label">In Shipping Pipeline</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{data.certifiedVehicles}</div>
            <div className="ops-stat-label">Certified &amp; Warrantied</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{data.activeInstalments}</div>
            <div className="ops-stat-label">Active Instalments</div>
          </div>
          <div className="ops-stat-card">
            <div className="ops-stat-value">{formatNaira(data.totalFinancedKobo)}</div>
            <div className="ops-stat-label">Total Financed</div>
          </div>
        </div>

        <div className="ops-panel" style={{ marginTop: 24 }}>
          <div className="ops-panel-title">Inventory Pipeline</div>
          {data.stageCounts.size === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>No vehicles on record yet.</div>
          ) : (
            <HorizontalBarChart
              data={LIFECYCLE_STAGES.filter((s) => (data.stageCounts.get(s) ?? 0) > 0).map((s) => ({
                label: stageLabel(s),
                value: data.stageCounts.get(s) ?? 0,
                colorVar: s === "available" ? "--green" : s === "reserved" ? "--amber" : PIPELINE_STAGES.includes(s) ? "--blue" : "--subtle",
              }))}
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Recent Leads</div>
            {data.recentLeads.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No leads yet.</div>
            ) : (
              data.recentLeads.map((lead, i) => (
                <div className="ops-info-row" key={i}>
                  <span className="ops-info-label">
                    {lead.phone} · {lead.source}
                  </span>
                  <span style={{ color: "var(--subtle)", fontSize: 12 }}>
                    {new Date(lead.created_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="ops-panel">
            <div className="ops-panel-title">Payments Due Soon</div>
            {data.upcomingPayments.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>Nothing due — every instalment is paid up.</div>
            ) : (
              data.upcomingPayments.map((p) => {
                const row = (
                  <>
                    <span className="ops-info-label">
                      {p.customers?.full_name ?? "—"} ·{" "}
                      {new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="ops-info-value">{formatNaira(p.amount_kobo)}</span>
                      <span className={`ops-badge ${STATUS_CLASS[p.status] ?? "ops-badge-muted"}`}>{p.status}</span>
                    </span>
                  </>
                );
                return p.invoiceId ? (
                  <Link key={p.id} href={`/ops/invoices/${p.invoiceId}`} className="ops-info-row" style={{ textDecoration: "none", color: "inherit" }}>
                    {row}
                  </Link>
                ) : (
                  <div className="ops-info-row" key={p.id}>
                    {row}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
