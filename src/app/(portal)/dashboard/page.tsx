import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/ops/TopBar";
import { customerGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import type { ApprovalStatus, Instalment, Vehicle } from "@/types";

const STATUS_COPY: Record<ApprovalStatus, { title: string; body: string; tone: string }> = {
  pending: {
    title: "Application Under Review",
    body: "A DMECH staff member is reviewing your registration. We'll update this once a decision is made.",
    tone: "ops-badge-amber",
  },
  stage2_docs: {
    title: "Additional Documents Needed",
    body: "We need a few more documents before we can finish reviewing your application — see the Documents tab.",
    tone: "ops-badge-blue",
  },
  approved: { title: "Approved", body: "", tone: "ops-badge-green" },
  declined: {
    title: "Application Declined",
    body: "Your registration wasn't approved this time. Contact DMECH directly if you have questions.",
    tone: "ops-badge-muted",
  },
};

export default async function PortalDashboardPage() {
  const customer = await customerGuard();
  if (!customer) redirect("/verify");

  const supabase = await createClient();
  const [vehiclesRes, instalmentsRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("buyer_id", customer.id).is("deleted_at", null),
    supabase.from("instalments").select("*, vehicles!vehicle_id(make,model,year)").eq("customer_id", customer.id),
  ]);

  const vehicles = (vehiclesRes.data as Vehicle[] | null) ?? [];
  const instalments = (instalmentsRes.data ?? []) as unknown as (Instalment & {
    vehicles: { make: string; model: string; year: number } | null;
  })[];

  const statusInfo = STATUS_COPY[customer.approval_status];

  return (
    <>
      <TopBar title={`Welcome, ${customer.full_name.split(" ")[0]}`} />
      <div className="ops-content">
        {customer.approval_status !== "approved" && (
          <div className="ops-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className={`ops-badge ${statusInfo.tone}`}>{customer.approval_status}</span>
              <span className="ops-panel-title" style={{ margin: 0 }}>{statusInfo.title}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{statusInfo.body}</div>
          </div>
        )}

        <div className="ops-panel">
          <div className="ops-panel-title">Your Vehicles</div>
          {vehicles.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No vehicles linked to your account yet.</div>
          ) : (
            vehicles.map((v) => (
              <div className="ops-info-row" key={v.id}>
                <span className="ops-info-label">{v.year} {v.make} {v.model}</span>
                <span className={`ops-badge ${stageBadgeClass(v.lifecycle_stage)}`}>{stageLabel(v.lifecycle_stage)}</span>
              </div>
            ))
          )}
        </div>

        <div className="ops-panel">
          <div className="ops-panel-title">Your Instalment Plans</div>
          {instalments.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No active instalment plans.</div>
          ) : (
            instalments.map((i) => (
              <div className="ops-info-row" key={i.id}>
                <span className="ops-info-label">
                  {i.vehicles ? `${i.vehicles.year} ${i.vehicles.make} ${i.vehicles.model}` : "Vehicle"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ops-info-value">
                    {i.monthly_amount_kobo ? `${formatNaira(i.monthly_amount_kobo)}/mo` : formatNaira(i.total_price_kobo)}
                  </span>
                  <Link href="/portal/payments" className="ops-badge ops-badge-blue" style={{ textDecoration: "none" }}>
                    {i.status}
                  </Link>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
