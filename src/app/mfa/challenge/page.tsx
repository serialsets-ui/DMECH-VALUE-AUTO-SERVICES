import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { Logo } from "@/components/Logo";
import { MfaChallengeForm } from "@/components/ops/MfaChallengeForm";
import { staffGuard } from "@/lib/guards";

// Top-level route, outside (ops) — same reasoning as /mfa/enroll.
export default async function MfaChallengePage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  return (
    <div data-theme="dark">
      <div className="login-page">
        <div className="login-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Logo variant="splash" />
          </div>
          <div className="login-title">Two-Factor Verification</div>
          <div className="login-subtitle">Enter the code from your authenticator app.</div>
          <MfaChallengeForm />
        </div>
      </div>
    </div>
  );
}
