import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { PartEditForm } from "@/components/ops/PartEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Part, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

export default async function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("parts").select("*").eq("id", id).maybeSingle();

  if (!data) notFound();
  const part = data as Part;
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar title={part.name} />
      <div className="ops-content">
        <div className="ops-panel" style={{ maxWidth: 520 }}>
          <div className="ops-panel-title">Details</div>
          <div className="ops-info-row">
            <span className="ops-info-label">Compatibility</span>
            <span className="ops-info-value">{part.compatibility ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Quantity</span>
            <span className="ops-info-value">{part.qty}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Reorder Threshold</span>
            <span className="ops-info-value">{part.reorder_threshold}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Cost Price</span>
            <span className="ops-info-value">{formatNaira(part.cost_price_kobo)}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Sale Price</span>
            <span className="ops-info-value">{formatNaira(part.sale_price_kobo)}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Source</span>
            <span className="ops-info-value">{part.source ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Condition</span>
            <span className="ops-info-value">{part.condition ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">VIN Trace</span>
            <span className="ops-info-value">{part.vin_trace ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Units Sold</span>
            <span className="ops-info-value">{part.units_sold}</span>
          </div>
        </div>

        {canEdit && (
          <PartEditForm
            partId={part.id}
            qty={part.qty}
            costPriceKobo={part.cost_price_kobo}
            salePriceKobo={part.sale_price_kobo}
            reorderThreshold={part.reorder_threshold}
            condition={part.condition}
          />
        )}
      </div>
    </>
  );
}
