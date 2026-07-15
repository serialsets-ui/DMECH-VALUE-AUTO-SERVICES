import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { Logo } from "@/components/Logo";
import { RegistrationForm } from "@/components/portal/RegistrationForm";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/verify?next=/register");

  const { data: userRow } = await supabase.from("users").select("id").eq("auth_user_id", authUser.id).maybeSingle();
  if (userRow) {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userRow.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (existingCustomer) redirect("/portal/dashboard");
  }

  return (
    <div data-theme="dark" style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <Logo variant="splash" />
      </div>
      <RegistrationForm email={authUser.email ?? ""} />
    </div>
  );
}
