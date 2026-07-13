import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { WarrantyClaim, WarrantyClaimStatus } from "@/types";

interface ClaimRow extends WarrantyClaim {
  customers: { full_name: string } | null;
  warranty_policies: { vehicles: { make: string; model: string; year: number } | null } | null;
}

const STATUS_CLASS: Record<WarrantyClaimStatus, string> = {
  submitted: "ops-badge-blue",
  assessed: "ops-badge-blue",
  approved: "ops-badge-green",
  denied: "ops-badge-muted",
  paid: "ops-badge-green",
};

export default async function WarrantyClaimsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("warranty_claims")
    .select("*, customers(full_name), warranty_policies(vehicles(make,model,year))")
    .order("reported_at", { ascending: false });

  const claims = (data as ClaimRow[] | null) ?? [];

  return (
    <>
      <TopBar title="Warranty Claims" />
      <div className="ops-content">
        {claims.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No warranty claims filed yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Assessed</th>
                  <th>Approved</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <ClickableRow key={c.id} href={`/ops/warranty-claims/${c.id}`}>
                    <td>
                      {c.warranty_policies?.vehicles
                        ? `${c.warranty_policies.vehicles.make} ${c.warranty_policies.vehicles.model} ${c.warranty_policies.vehicles.year}`
                        : "—"}
                    </td>
                    <td>{c.customers?.full_name ?? "—"}</td>
                    <td>
                      <span className={`ops-badge ${STATUS_CLASS[c.status]}`}>{c.status}</span>
                    </td>
                    <td>{c.assessed_cost_kobo ? formatNaira(c.assessed_cost_kobo) : "—"}</td>
                    <td>{c.approved_kobo ? formatNaira(c.approved_kobo) : "—"}</td>
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
