"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import "@/styles/ops.css";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

// Passwordless customer auth — Supabase's own signInWithOtp() sends the
// magic-link email via its built-in mailer, no Termii/Zeptomail integration
// needed for this. The link redirects to /auth/callback (a route handler,
// not a page — it needs to set cookies) which exchanges the code for a
// session and forwards to `next`.
function VerifyForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/portal/dashboard";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (otpError) {
      setError("Could not send the login link. Check the email address and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo variant="splash" />
        </div>
        <div className="login-title">Customer Portal</div>
        <div className="login-subtitle">Sign in with a one-time link — no password needed</div>

        {sent ? (
          <div style={{ fontSize: 14, color: "var(--text)", textAlign: "center", padding: "12px 0" }}>
            Check <strong>{email}</strong> for a login link. It expires shortly, so use it soon
            after it arrives.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Login Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div data-theme="dark">
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
