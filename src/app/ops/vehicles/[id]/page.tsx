import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { VehicleEditForm } from "@/components/ops/VehicleEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira, formatUsd, usdCentsToDollars } from "@/lib/money";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import { LIFECYCLE_STAGES_BY_CHANNEL } from "@/types";
import type { Vehicle, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();
  const vehicle = data as Vehicle;
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  const stages = LIFECYCLE_STAGES_BY_CHANNEL[vehicle.acquisition_channel];
  const currentIndex = stages.indexOf(vehicle.lifecycle_stage);

  return (
    <>
      <TopBar title={`${vehicle.make} ${vehicle.model} ${vehicle.year}`} />
      <div className="ops-content">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span className={`ops-badge ${stageBadgeClass(vehicle.lifecycle_stage)}`}>
            {stageLabel(vehicle.lifecycle_stage)}
          </span>
          {vehicle.vin && (
            <span style={{ color: "var(--subtle)", fontSize: 12 }}>VIN: {vehicle.vin}</span>
          )}
        </div>

        <div className="ops-stage-bar">
          {stages.map((stage, i) => (
            <span
              key={stage}
              className={`ops-stage-dot ${
                i === currentIndex ? "active" : i < currentIndex ? "done" : ""
              }`}
            >
              {stageLabel(stage)}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Specs</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Source</span>
              <span className="ops-info-value">
                {vehicle.source_region === "nigeria"
                  ? "Nigeria (locally sourced)"
                  : `${vehicle.source_region ?? "—"}${vehicle.source_detail ? ` — ${vehicle.source_detail}` : ""}`}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Condition</span>
              <span className="ops-info-value">
                {vehicle.condition === "new" ? "Brand New" : "Used (Tokunbo)"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">
                {vehicle.fuel_type === "electric" ? "Range" : "Engine"}
              </span>
              <span className="ops-info-value">
                {vehicle.fuel_type === "electric"
                  ? `${vehicle.battery_range_km ?? "—"} km`
                  : `${vehicle.engine_cc ?? "—"}cc`}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Fuel Type</span>
              <span className="ops-info-value">{vehicle.fuel_type ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Colour</span>
              <span className="ops-info-value">{vehicle.colour ?? "—"}</span>
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel-title">Pricing</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Purchase Price</span>
              <span className="ops-info-value">
                {vehicle.purchase_price_usd_cents
                  ? formatUsd(usdCentsToDollars(vehicle.purchase_price_usd_cents))
                  : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Shipping Cost</span>
              <span className="ops-info-value">
                {vehicle.shipping_cost_usd_cents
                  ? formatUsd(usdCentsToDollars(vehicle.shipping_cost_usd_cents))
                  : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Customs Duty</span>
              <span className="ops-info-value">
                {vehicle.customs_duty_kobo ? formatNaira(vehicle.customs_duty_kobo) : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Cost Basis</span>
              <span className="ops-info-value">
                {vehicle.cost_basis_kobo ? formatNaira(vehicle.cost_basis_kobo) : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Sale Price</span>
              <span className="ops-info-value">
                {vehicle.sale_price_kobo ? formatNaira(vehicle.sale_price_kobo) : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Margin</span>
              <span className="ops-info-value">
                {vehicle.margin_pct !== null ? `${vehicle.margin_pct}%` : "—"}
              </span>
            </div>
          </div>
        </div>

        {vehicle.condition_report.length > 0 && (
          <div className="ops-panel">
            <div className="ops-panel-title">Condition Report</div>
            {vehicle.condition_report.map((item) => (
              <div className="ops-info-row" key={item.area}>
                <span className="ops-info-label">{item.area}</span>
                <span className="ops-info-value">
                  {item.score}
                  {item.notes ? ` — ${item.notes}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <VehicleEditForm
            vehicleId={vehicle.id}
            stages={stages}
            lifecycleStage={vehicle.lifecycle_stage}
            salePriceKobo={vehicle.sale_price_kobo}
            condition={vehicle.condition}
            colour={vehicle.colour}
            certificationStatus={vehicle.certification_status}
          />
        )}
      </div>
    </>
  );
}
