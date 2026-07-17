import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { InvoiceForm } from "@/components/ops/InvoiceForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

export default async function NewInvoicePage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) redirect("/ops/invoices");

  const supabase = await createClient();
  const [customersRes, vehiclesRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, tin")
      .is("deleted_at", null)
      .neq("type", "dealer_partner")
      .order("full_name"),
    supabase
      .from("vehicles")
      .select("id, make, model, year, sale_price_kobo")
      .is("deleted_at", null)
      .not("lifecycle_stage", "in", "(sold,delivered)")
      .order("make"),
  ]);

  return (
    <>
      <TopBar title="New Invoice" />
      <div className="ops-content">
        <InvoiceForm customers={customersRes.data ?? []} vehicles={vehiclesRes.data ?? []} />
      </div>
    </>
  );
}
