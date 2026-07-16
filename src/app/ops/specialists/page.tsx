import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { SpecialistManager } from "@/components/ops/SpecialistManager";
import { roleGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { Specialist, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

export default async function SpecialistsPage() {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) redirect("/ops/dashboard");

  const supabase = await createClient();
  const { data } = await supabase.from("specialists").select("*").order("created_at", { ascending: true });

  return (
    <>
      <TopBar title="Specialists" />
      <div className="ops-content">
        <SpecialistManager specialists={(data as Specialist[] | null) ?? []} />
      </div>
    </>
  );
}
