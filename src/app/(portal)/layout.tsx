import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { PortalNav } from "@/components/portal/PortalNav";
import { customerGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";

// Redundant with middleware's coarse "is there a session" check by design,
// same reasoning as ops/layout.tsx — but a customer can also be
// authenticated with no customers row yet (verified email, never finished
// /register), which customerGuard() alone can't distinguish from "not
// logged in at all". Check auth first so that case redirects to /register,
// not back to /verify in a loop.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const customer = await customerGuard();
  if (!customer) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    redirect(authUser ? "/register" : "/verify");
  }

  return (
    <div data-theme="dark">
      <div className="ops-layout">
        <PortalNav customer={customer} />
        <main className="ops-main">{children}</main>
      </div>
    </div>
  );
}
