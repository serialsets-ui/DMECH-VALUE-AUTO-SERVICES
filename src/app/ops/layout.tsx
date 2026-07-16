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
  if (staff.must_change_password) redirect("/change-password");

  // Mandatory TOTP 2FA for every Ops account, any role. Checked after the
  // password-change gate on purpose — a still-temporary password shouldn't
  // get enrolled as the credential protecting a 2FA factor.
  const mfaStatus = await getMfaStatus();
  if (mfaStatus === "needs_enroll") redirect("/mfa/enroll");
  if (mfaStatus === "needs_challenge") redirect("/mfa/challenge");

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
