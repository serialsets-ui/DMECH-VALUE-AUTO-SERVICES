import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import type { Vehicle, AcquisitionChannel } from "@/types";

const CHANNEL_LABEL: Record<AcquisitionChannel, string> = {
  import: "Import",
  local_outright: "Local Outright",
  consignment: "Consignment",
  trade_in: "Trade-In",
};

export default async function OpsVehiclesPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const vehicles = (data as Vehicle[] | null) ?? [];

  return (
    <>
      <TopBar title="Vehicles" />
      <div className="ops-content">
        {vehicles.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No vehicles in the system yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Stage</th>
                  <th>Channel</th>
                  <th>Price</th>
                  <th>Certification</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <ClickableRow key={v.id} href={`/ops/vehicles/${v.id}`}>
                    <td>
                      {v.make} {v.model} {v.year}
                    </td>
                    <td>
                      <span className={`ops-badge ${stageBadgeClass(v.lifecycle_stage)}`}>
                        {stageLabel(v.lifecycle_stage)}
                      </span>
                    </td>
                    <td>{CHANNEL_LABEL[v.acquisition_channel]}</td>
                    <td>{v.sale_price_kobo ? formatNaira(v.sale_price_kobo) : "—"}</td>
                    <td>
                      {v.certification_status === "certified" ? (
                        <span className="ops-badge ops-badge-green">Certified</span>
                      ) : (
                        <span style={{ color: "var(--subtle)", fontSize: 12 }}>
                          {v.certification_status === "pending_inspection"
                            ? "Pending"
                            : "Uncertified"}
                        </span>
                      )}
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
