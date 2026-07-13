import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { Shipment } from "@/types";

export default async function OpsShipmentsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });

  const shipments = (data as Shipment[] | null) ?? [];

  return (
    <>
      <TopBar title="Shipments" />
      <div className="ops-content">
        {shipments.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No shipments tracked yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Route</th>
                  <th>ETA</th>
                  <th>Progress</th>
                  <th>Vessel</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <ClickableRow key={s.id} href={`/ops/shipments/${s.id}`}>
                    <td>{s.reference}</td>
                    <td>
                      {s.origin} → {s.destination}
                    </td>
                    <td>{s.eta ? new Date(s.eta).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "—"}</td>
                    <td>{s.progress_pct}%</td>
                    <td>{s.vessel_name ?? "—"}</td>
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
