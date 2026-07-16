"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Could not update password.");
      setLoading(false);
      return;
    }

    await fetch("/api/auth/clear-password-flag", { method: "POST" });
    router.push("/ops/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="login-label" htmlFor="new-password">
        New Password
      </label>
      <input
        id="new-password"
        type="password"
        className="login-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <label className="login-label" htmlFor="confirm-password">
        Confirm Password
      </label>
      <input
        id="confirm-password"
        type="password"
        className="login-input"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      {error && <div className="login-error">{error}</div>}
      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Saving..." : "Set Password"}
      </button>
    </form>
  );
}
