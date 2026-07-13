import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ShipmentEditForm } from "@/components/ops/ShipmentEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import type { Shipment, Vehicle, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager"];

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const [shipmentRes, vehiclesRes] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase.from("vehicles").select("*").eq("shipment_id", id).is("deleted_at", null),
  ]);

  if (!shipmentRes.data) notFound();
  const shipment = shipmentRes.data as Shipment;
  const vehicles = (vehiclesRes.data as Vehicle[] | null) ?? [];
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar title={shipment.reference} />
      <div className="ops-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Details</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Cargo Type</span>
              <span className="ops-info-value">{shipment.cargo_type}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Route</span>
              <span className="ops-info-value">
                {shipment.origin} → {shipment.destination}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Departed</span>
              <span className="ops-info-value">
                {shipment.departed_at
                  ? new Date(shipment.departed_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">ETA</span>
              <span className="ops-info-value">
                {shipment.eta
                  ? new Date(shipment.eta).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Progress</span>
              <span className="ops-info-value">{shipment.progress_pct}%</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Vessel</span>
              <span className="ops-info-value">{shipment.vessel_name ?? "—"}</span>
            </div>
            {shipment.tracking_url && (
              <div className="ops-info-row">
                <span className="ops-info-label">Tracking</span>
                <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                  View →
                </a>
              </div>
            )}
          </div>

          <div className="ops-panel">
            <div className="ops-panel-title">Vehicles on This Shipment</div>
            {vehicles.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No vehicles linked yet.</div>
            ) : (
              vehicles.map((v) => (
                <div className="ops-info-row" key={v.id}>
                  <Link href={`/ops/vehicles/${v.id}`} style={{ color: "var(--blue)" }}>
                    {v.make} {v.model} {v.year}
                  </Link>
                  <span className={`ops-badge ${stageBadgeClass(v.lifecycle_stage)}`}>
                    {stageLabel(v.lifecycle_stage)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {canEdit && (
          <ShipmentEditForm
            shipmentId={shipment.id}
            progressPct={shipment.progress_pct}
            eta={shipment.eta}
            vesselName={shipment.vessel_name}
            trackingUrl={shipment.tracking_url}
            departedAt={shipment.departed_at}
          />
        )}
      </div>
    </>
  );
}
