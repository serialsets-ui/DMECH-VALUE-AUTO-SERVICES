"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MfaChallengeForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadFactor() {
      const supabase = createClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      // The `.totp` array only ever contains verified factors by type.
      const verified = data?.totp[0];
      if (listError || !verified) {
        setError("No verified authenticator found on this account — contact an admin.");
        return;
      }
      setFactorId(verified.id);
      setReady(true);
    }
    loadFactor();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError(challengeError?.message || "Something went wrong.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError("Incorrect code — try again.");
      setLoading(false);
      return;
    }

    router.push("/ops/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
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
        disabled={!ready}
        autoFocus
      />
      {error && <div className="login-error">{error}</div>}
      <button type="submit" className="login-btn" disabled={loading || !ready || code.length !== 6}>
        {loading ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
