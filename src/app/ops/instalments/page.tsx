import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Instalment, InstalmentStatus, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

interface InstalmentRow extends Instalment {
  customers: { full_name: string; phone: string } | null;
  vehicles: { make: string; model: string; year: number } | null;
}

const STATUS_CLASS: Record<InstalmentStatus, string> = {
  active: "ops-badge-blue",
  completed: "ops-badge-green",
  defaulted: "ops-badge-amber",
  cancelled: "ops-badge-muted",
};

export default async function OpsInstalmentsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  // vehicles!vehicle_id disambiguates: PostgREST otherwise sees two FK paths
  // between instalments and vehicles (this one, plus vehicles.
  // trade_in_applied_to_instalment_id pointing back) and returns 300
  // Multiple Choices instead of guessing.
  const { data } = await supabase
    .from("instalments")
    .select("*, customers(full_name,phone), vehicles!vehicle_id(make,model,year)")
    .order("created_at", { ascending: false });

  const instalments = (data as InstalmentRow[] | null) ?? [];

  return (
    <>
      <TopBar
        title="Instalments"
        actions={
          EDIT_ROLES.includes(staff.role as StaffRole) ? (
            <Link href="/ops/instalments/new" className="ops-btn" style={{ textDecoration: "none" }}>
              + New Instalment
            </Link>
          ) : undefined
        }
      />
      <div className="ops-content">
        {instalments.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No instalment plans yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Plan</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Deposit</th>
                </tr>
              </thead>
              <tbody>
                {instalments.map((i) => (
                  <ClickableRow key={i.id} href={`/ops/instalments/${i.id}`}>
                    <td>{i.customers?.full_name ?? "—"}</td>
                    <td>
                      {i.vehicles ? `${i.vehicles.make} ${i.vehicles.model} ${i.vehicles.year}` : "—"}
                    </td>
                    <td>{i.plan_type === "dmech_direct" ? "DMECH Direct" : "Partner Finance (Autochek)"}</td>
                    <td>{formatNaira(i.total_price_kobo)}</td>
                    <td>
                      <span className={`ops-badge ${STATUS_CLASS[i.status]}`}>{i.status}</span>
                    </td>
                    <td>{i.deposit_paid ? "Paid" : "Pending"}</td>
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
