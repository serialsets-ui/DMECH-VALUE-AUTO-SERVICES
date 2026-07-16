import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { Logo } from "@/components/Logo";
import { ChangePasswordForm } from "@/components/ops/ChangePasswordForm";
import { staffGuard } from "@/lib/guards";

// Deliberately a top-level route, outside the (ops) group — ops/layout.tsx
// redirects here whenever must_change_password is true, so this page can't
// itself be wrapped in that same guard without creating a redirect loop.
export default async function ChangePasswordPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  return (
    <div data-theme="dark">
      <div className="login-page">
        <div className="login-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Logo variant="splash" />
          </div>
          <div className="login-title">Set a New Password</div>
          <div className="login-subtitle">
            {staff.must_change_password
              ? "Your account was created with a temporary password — set your own before continuing."
              : "Change your password."}
          </div>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
