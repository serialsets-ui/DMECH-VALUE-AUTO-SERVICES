import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { OpsShell } from "@/components/ops/OpsShell";
import { Sidebar } from "@/components/ops/Sidebar";
import { staffGuard } from "@/lib/guards";
import { getMfaStatus } from "@/lib/mfa";

// Redundant with middleware's coarse "is there a session" check by design —
// middleware only confirms a session exists, not that it belongs to an
// active staff `users` row with a non-customer role. staffGuard() checks
// that specifically; defense in depth, not duplication.
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  // Supabase requires an AAL2 session to update a password once an account
  // already has a verified TOTP factor -- so an account with MFA already
  // enrolled must clear the challenge (elevating the fresh AAL1 login
  // session to AAL2) before must_change_password can be satisfied. A brand
  // new account with no factor yet has no such requirement, so it changes
  // its password first and only enrolls MFA afterwards.
  const mfaStatus = await getMfaStatus();
  if (mfaStatus === "needs_challenge") redirect("/mfa/challenge");
  if (staff.must_change_password) redirect("/change-password");
  if (mfaStatus === "needs_enroll") redirect("/mfa/enroll");

  return (
    <div data-theme="dark">
      <OpsShell>
        <div className="ops-layout">
          <Sidebar staff={staff} />
          <main className="ops-main">{children}</main>
        </div>
      </OpsShell>
    </div>
  );
}
