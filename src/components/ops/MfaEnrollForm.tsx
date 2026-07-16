"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "ready" | "verifying" | "error";

export function MfaEnrollForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    async function startEnroll() {
      const supabase = createClient();
      // A stale unverified factor from an abandoned enrollment attempt
      // blocks re-enrolling with the same name — clear it first. Per-type
      // arrays like `.totp` only ever contain verified factors; unverified
      // ones only show up in `.all`.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const unverified = existing?.all.find((f) => f.factor_type === "totp" && f.status === "unverified");
      if (unverified) {
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (cancelled) return;
      if (enrollError || !data) {
        setError(enrollError?.message || "Could not start enrollment.");
        setStatus("error");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStatus("ready");
    }
    startEnroll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setStatus("verifying");

    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError(challengeError?.message || "Something went wrong.");
      setStatus("ready");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError("Incorrect code — check your authenticator app and try again.");
      setStatus("ready");
      return;
    }

    router.push("/ops/dashboard");
    router.refresh();
  }

  if (status === "loading") {
    return <p className="login-subtitle">Setting up two-factor authentication...</p>;
  }

  if (status === "error" && !qrCode) {
    return <div className="login-error">{error}</div>;
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
        Scan this code with an authenticator app (Google Authenticator, Authy, 1Password, etc.),
        then enter the 6-digit code it shows to finish setup.
      </p>
      {qrCode && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URI SVG from Supabase, not a static /public asset */}
          <img src={qrCode} alt="Scan with your authenticator app" width={180} height={180} style={{ borderRadius: 8, background: "#fff", padding: 8 }} />
        </div>
      )}
      {secret && (
        <p style={{ fontSize: 11, color: "var(--subtle)", textAlign: "center", marginBottom: 20, wordBreak: "break-all" }}>
          Can&apos;t scan? Enter this key manually: <strong>{secret}</strong>
        </p>
      )}
      <form onSubmit={handleVerify}>
        <label className="login-label" htmlFor="mfa-code">
          6-Digit Code
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="login-input"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          minLength={6}
          maxLength={6}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={status === "verifying" || code.length !== 6}>
          {status === "verifying" ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
    </div>
  );
}
