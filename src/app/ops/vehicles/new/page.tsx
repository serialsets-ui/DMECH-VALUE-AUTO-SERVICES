import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { VehicleIntakeForm } from "@/components/ops/VehicleIntakeForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

export default async function NewVehiclePage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) redirect("/ops/vehicles");

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");

  return (
    <>
      <TopBar title="Add Vehicle" />
      <div className="ops-content">
        <VehicleIntakeForm customers={customers ?? []} />
      </div>
    </>
  );
}
