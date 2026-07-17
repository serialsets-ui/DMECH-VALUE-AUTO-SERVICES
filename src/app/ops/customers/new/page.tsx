import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { CustomerIntakeForm } from "@/components/ops/CustomerIntakeForm";
import { roleGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "sales_rep", "accountant"];

export default async function NewCustomerPage() {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) redirect("/ops/customers");

  return (
    <>
      <TopBar title="Register Customer" />
      <div className="ops-content">
        <CustomerIntakeForm />
      </div>
    </>
  );
}
