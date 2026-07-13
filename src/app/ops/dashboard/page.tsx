import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";

const PIPELINE_STAGES = ["shipped", "in_transit", "at_port", "customs", "cleared"];

interface RecentLead {
  phone: string;
  source: string;
  created_at: string;
}

interface DashboardData {
  totalVehicles: number;
  availableVehicles: number;
  pipelineVehicles: number;
  certifiedVehicles: number;
  activeInstalments: number;
  totalFinancedKobo: number;
  recentLeads: RecentLead[];
}

const EMPTY_DASHBOARD: DashboardData = {
  totalVehicles: 0,
  availableVehicles: 0,
  pipelineVehicles: 0,
  certifiedVehicles: 0,
  activeInstalments: 0,
  totalFinancedKobo: 0,
  recentLeads: [],
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
    ]);

    const totalFinancedKobo = (instalmentTotals.data ?? []).reduce(
      (sum, row) => sum + (row.total_price_kobo ?? 0),
      0,
    );

    return {
      totalVehicles: totalVehicles.count ?? 0,
      availableVehicles: availableVehicles.count ?? 0,
      pipelineVehicles: pipelineVehicles.count ?? 0,
      certifiedVehicles: certifiedVehicles.count ?? 0,
      activeInstalments: activeInstalments.count ?? 0,
      totalFinancedKobo,
      recentLeads: (recentLeads.data as RecentLead[] | null) ?? [],
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

        <div className="ops-panel" style={{ marginTop: 24, maxWidth: 520 }}>
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
      </div>
    </>
  );
}
