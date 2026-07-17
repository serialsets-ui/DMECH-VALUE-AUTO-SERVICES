import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { DealerPartnerForm } from "@/components/ops/DealerPartnerForm";
import { roleGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "ops_manager"];

export default async function NewDealerPartnerPage() {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) redirect("/ops/dealer-partners");

  return (
    <>
      <TopBar title="Add Dealer Partner" />
      <div className="ops-content">
        <DealerPartnerForm />
      </div>
    </>
  );
}
