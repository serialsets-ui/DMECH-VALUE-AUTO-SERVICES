import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { Customer, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "ops_manager"];

export default async function DealerPartnersPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("type", "dealer_partner")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const dealerPartners = (data as Customer[] | null) ?? [];

  return (
    <>
      <TopBar
        title="Dealer Partners"
        actions={
          EDIT_ROLES.includes(staff.role as StaffRole) ? (
            <Link href="/ops/dealer-partners/new" className="ops-btn" style={{ textDecoration: "none" }}>
              + Add Dealer Partner
            </Link>
          ) : undefined
        }
      />
      <div className="ops-content">
        {dealerPartners.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No dealer partners yet — add one to start sourcing vehicles from them via
            Consignment on Vehicle Intake.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {dealerPartners.map((d) => {
                  const company = d.company_details as { contact_person?: string } | null;
                  return (
                    <ClickableRow key={d.id} href={`/ops/dealer-partners/${d.id}`}>
                      <td>{d.full_name}</td>
                      <td>{company?.contact_person || "—"}</td>
                      <td>{d.phone}</td>
                      <td>{d.email ?? "—"}</td>
                    </ClickableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
