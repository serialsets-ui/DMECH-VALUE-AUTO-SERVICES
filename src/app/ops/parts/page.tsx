import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Part } from "@/types";

export default async function OpsPartsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase.from("parts").select("*").order("name");

  const parts = (data as Part[] | null) ?? [];

  return (
    <>
      <TopBar title="Parts" />
      <div className="ops-content">
        {parts.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No parts in inventory yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Compatibility</th>
                  <th>Qty</th>
                  <th>Sale Price</th>
                  <th>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <ClickableRow key={p.id} href={`/ops/parts/${p.id}`}>
                    <td>{p.name}</td>
                    <td>{p.compatibility ?? "—"}</td>
                    <td>
                      <span
                        className={`ops-badge ${
                          p.qty <= p.reorder_threshold ? "ops-badge-amber" : "ops-badge-muted"
                        }`}
                      >
                        {p.qty}
                      </span>
                    </td>
                    <td>{formatNaira(p.sale_price_kobo)}</td>
                    <td>{p.units_sold}</td>
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
