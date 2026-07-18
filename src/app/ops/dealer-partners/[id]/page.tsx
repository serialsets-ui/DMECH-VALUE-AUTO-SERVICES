import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import { ConsignmentPayoutAction } from "@/components/ops/ConsignmentPayoutAction";
import type { Customer, StaffRole, Vehicle } from "@/types";

const PAYOUT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant"];

export default async function DealerPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const [dealerRes, vehiclesRes] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("type", "dealer_partner").maybeSingle(),
    supabase.from("vehicles").select("*").eq("consignor_customer_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
  ]);

  if (!dealerRes.data) notFound();
  const dealer = dealerRes.data as Customer;
  const vehicles = (vehiclesRes.data as Vehicle[] | null) ?? [];
  const company = dealer.company_details as { rc_number?: string; contact_person?: string } | null;

  return (
    <>
      <TopBar title={dealer.full_name} />
      <div className="ops-content">
        <div className="ops-grid-2">
          <div className="ops-panel">
            <div className="ops-panel-title">Business Details</div>
            <div className="ops-info-row">
              <span className="ops-info-label">RC Number</span>
              <span className="ops-info-value">{company?.rc_number || "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Contact Person</span>
              <span className="ops-info-value">{company?.contact_person || "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Phone</span>
              <span className="ops-info-value">{dealer.phone}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Email</span>
              <span className="ops-info-value">{dealer.email ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Address</span>
              <span className="ops-info-value">{dealer.address ?? "—"}</span>
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel-title">Vehicles Sourced ({vehicles.length})</div>
            {vehicles.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                None yet — pick this dealer as the Consignor on Vehicle Intake (Consignment channel).
              </div>
            ) : (
              vehicles.map((v) => (
                <div className="ops-info-row" key={v.id} style={{ flexWrap: "wrap", gap: 8 }}>
                  <Link href={`/ops/vehicles/${v.id}`} style={{ color: "var(--blue)" }}>
                    {v.year} {v.make} {v.model}
                  </Link>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {v.sale_price_kobo && <span className="ops-info-value">{formatNaira(v.sale_price_kobo)}</span>}
                    <span className={`ops-badge ${stageBadgeClass(v.lifecycle_stage)}`}>{stageLabel(v.lifecycle_stage)}</span>
                  </span>
                  {v.consignment_payout_kobo != null && (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "flex-end", fontSize: 13 }}>
                      <span style={{ color: "var(--muted)" }}>Payout: {formatNaira(v.consignment_payout_kobo)}</span>
                      {PAYOUT_ROLES.includes(staff.role as StaffRole) ? (
                        <ConsignmentPayoutAction vehicleId={v.id} paidAt={v.consignment_payout_paid_at} />
                      ) : (
                        <span className={`ops-badge ${v.consignment_payout_paid_at ? "ops-badge-green" : "ops-badge-amber"}`}>
                          {v.consignment_payout_paid_at ? "Paid" : "Unpaid"}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
