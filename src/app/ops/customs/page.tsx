import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { customsStatusBadgeClass } from "@/lib/ops/customs-status";
import type { CustomsEntry } from "@/types";

interface CustomsRow extends CustomsEntry {
  vehicles: { make: string; model: string; year: number } | null;
}

export default async function OpsCustomsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("customs_entries")
    .select("*, vehicles(make,model,year)")
    .order("created_at", { ascending: false });

  const entries = (data as CustomsRow[] | null) ?? [];

  return (
    <>
      <TopBar title="Customs" />
      <div className="ops-content">
        {entries.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No customs entries yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Duty Estimated</th>
                  <th>Duty Paid</th>
                  <th>Cleared</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((c) => (
                  <ClickableRow key={c.id} href={`/ops/customs/${c.id}`}>
                    <td>{c.vehicles ? `${c.vehicles.make} ${c.vehicles.model} ${c.vehicles.year}` : "—"}</td>
                    <td>{c.agent ?? "—"}</td>
                    <td>
                      <span className={`ops-badge ${customsStatusBadgeClass(c.status)}`}>{c.status}</span>
                    </td>
                    <td>{c.duty_estimated_kobo ? formatNaira(c.duty_estimated_kobo) : "—"}</td>
                    <td>{c.duty_paid_kobo ? formatNaira(c.duty_paid_kobo) : "—"}</td>
                    <td>
                      {c.cleared_at
                        ? new Date(c.cleared_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                        : "—"}
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
