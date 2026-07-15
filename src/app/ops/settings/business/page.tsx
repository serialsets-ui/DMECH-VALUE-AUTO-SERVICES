import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { BusinessProfileForm } from "@/components/ops/BusinessProfileForm";
import { roleGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { BusinessProfile } from "@/types";

export default async function BusinessSettingsPage() {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) redirect("/ops/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_config")
    .select("value")
    .eq("key", "business_profile")
    .maybeSingle();

  return (
    <>
      <TopBar title="Business Settings" />
      <div className="ops-content">
        <BusinessProfileForm profile={(data?.value as BusinessProfile | null) ?? {}} />
      </div>
    </>
  );
}
