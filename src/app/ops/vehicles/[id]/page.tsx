import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { VehicleEditForm } from "@/components/ops/VehicleEditForm";
import { VehiclePhotoManager } from "@/components/ops/VehiclePhotoManager";
import { InspectionPanel } from "@/components/ops/InspectionPanel";
import { RecordSaleForm } from "@/components/ops/RecordSaleForm";
import { TradeInCreditForm } from "@/components/ops/TradeInCreditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira, formatUsd, usdCentsToDollars } from "@/lib/money";
import { conditionLabel } from "@/lib/vehicle-display";
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
  const isSold = vehicle.lifecycle_stage === "sold" || vehicle.lifecycle_stage === "delivered";

  let openInstalments: { id: string; total_price_kobo: number; customers: { full_name: string } | null }[] = [];
  if (canEdit && vehicle.acquisition_channel === "trade_in" && !vehicle.trade_in_applied_to_instalment_id) {
    const { data: instalments } = await supabase
      .from("instalments")
      .select("id, total_price_kobo, customers(full_name)")
      .eq("status", "active");
    // Supabase's generic (non-generated) types infer every embed as an
    // array regardless of cardinality — this FK is many-to-one, so cast to
    // the shape it actually returns at runtime.
    openInstalments = (instalments ?? []) as unknown as typeof openInstalments;
  }

  let saleCustomers: { id: string; full_name: string }[] = [];
  if (canEdit && !isSold && vehicle.sale_price_kobo) {
    const { data: customerRows } = await supabase
      .from("customers")
      .select("id, full_name")
      .is("deleted_at", null)
      .order("full_name");
    saleCustomers = customerRows ?? [];
  }

  return (
    <>
      <TopBar title={`${vehicle.make} ${vehicle.model} ${vehicle.year}`} />
      <div className="ops-content">
        {canEdit ? (
          <VehiclePhotoManager vehicleId={vehicle.id} initialPhotos={vehicle.photos} />
        ) : (
          vehicle.photos.length > 0 && (
            <div className="ops-panel">
              <div className="ops-panel-title">Photos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                {vehicle.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
                  <img key={photo.id} src={photo.url} alt="Vehicle" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                ))}
              </div>
            </div>
          )
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span className={`ops-badge ${stageBadgeClass(vehicle.lifecycle_stage)}`}>
            {stageLabel(vehicle.lifecycle_stage)}
          </span>
          <span className={`ops-badge ${vehicle.is_published ? "ops-badge-blue" : "ops-badge-muted"}`}>
            {vehicle.is_published ? "Published" : "Unpublished"}
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
                {conditionLabel(vehicle)}
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
            {vehicle.lot_number && (
              <div className="ops-info-row">
                <span className="ops-info-label">Lot Number</span>
                <span className="ops-info-value">{vehicle.lot_number}</span>
              </div>
            )}
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

        {canEdit ? (
          <InspectionPanel
            vehicleId={vehicle.id}
            conditionReport={vehicle.condition_report}
            titleVerification={vehicle.title_verification}
            certificationStatus={vehicle.certification_status}
            salePriceKobo={vehicle.sale_price_kobo}
            photos={vehicle.photos}
          />
        ) : (
          vehicle.condition_report.length > 0 && (
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
          )
        )}

        {canEdit && (
          <VehicleEditForm
            vehicleId={vehicle.id}
            stages={stages}
            lifecycleStage={vehicle.lifecycle_stage}
            salePriceKobo={vehicle.sale_price_kobo}
            condition={vehicle.condition}
            sourceRegion={vehicle.source_region}
            colour={vehicle.colour}
            videoUrl={vehicle.video_url}
            isPublished={vehicle.is_published}
            lotNumber={vehicle.lot_number}
            seoTitle={vehicle.seo_title}
            seoDescription={vehicle.seo_description}
            photos={vehicle.photos}
            useCategories={vehicle.use_categories}
          />
        )}

        {canEdit && !isSold && vehicle.sale_price_kobo && (
          <RecordSaleForm
            vehicleId={vehicle.id}
            acquisitionChannel={vehicle.acquisition_channel}
            certificationStatus={vehicle.certification_status}
            customers={saleCustomers}
          />
        )}

        {canEdit && vehicle.acquisition_channel === "trade_in" && !vehicle.trade_in_applied_to_instalment_id && (
          <TradeInCreditForm
            vehicleId={vehicle.id}
            tradeInCreditKobo={vehicle.trade_in_credit_kobo}
            instalments={openInstalments}
          />
        )}
      </div>
    </>
  );
}
