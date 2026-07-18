import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { InstalmentIntakeForm } from "@/components/ops/InstalmentIntakeForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { getConfigValue } from "@/lib/platform-config";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

export default async function NewInstalmentPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) redirect("/ops/invoices");

  const supabase = await createClient();
  const [customersRes, vehiclesRes, depositPct, tenorMonths, adminFeePct] = await Promise.all([
    supabase.from("customers").select("id, full_name").is("deleted_at", null).order("full_name"),
    supabase
      .from("vehicles")
      .select("id, make, model, year, sale_price_kobo")
      .not("sale_price_kobo", "is", null)
      .not("lifecycle_stage", "in", "(sold,delivered)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getConfigValue("default_deposit_pct", 40),
    getConfigValue("default_tenor_months", 6),
    getConfigValue("dmech_service_fee_pct", 8),
  ]);

  return (
    <>
      <TopBar title="New Instalment Plan" />
      <div className="ops-content">
        <InstalmentIntakeForm
          customers={customersRes.data ?? []}
          vehicles={vehiclesRes.data ?? []}
          defaultDepositPct={depositPct}
          defaultTenorMonths={tenorMonths}
          defaultAdminFeePct={adminFeePct}
        />
      </div>
    </>
  );
}
