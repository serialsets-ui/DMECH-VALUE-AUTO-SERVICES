import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { Logo } from "@/components/Logo";
import { MfaEnrollForm } from "@/components/ops/MfaEnrollForm";
import { staffGuard } from "@/lib/guards";

// Top-level route, outside (ops) — ops/layout.tsx redirects here, so this
// page can't itself sit inside that guard without a redirect loop.
export default async function MfaEnrollPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  return (
    <div data-theme="dark">
      <div className="login-page">
        <div className="login-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Logo variant="splash" />
          </div>
          <div className="login-title">Set Up Two-Factor Authentication</div>
          <div className="login-subtitle">Required for every Ops account before continuing.</div>
          <MfaEnrollForm />
        </div>
      </div>
    </div>
  );
}
