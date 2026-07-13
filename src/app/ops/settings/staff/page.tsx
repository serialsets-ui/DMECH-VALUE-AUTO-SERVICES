import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { StaffManager } from "@/components/ops/StaffManager";
import { roleGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { DmechUser } from "@/types";

export default async function StaffSettingsPage() {
  const staff = await roleGuard(["super_admin"]);
  if (!staff) redirect("/ops/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .neq("role", "customer")
    .order("created_at", { ascending: true });

  return (
    <>
      <TopBar title="Staff" />
      <div className="ops-content">
        <StaffManager staff={(data as DmechUser[] | null) ?? []} currentUserId={staff.id} />
      </div>
    </>
  );
}
