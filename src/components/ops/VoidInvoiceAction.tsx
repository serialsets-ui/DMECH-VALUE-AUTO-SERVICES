"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VoidInvoiceAction({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function voidInvoice() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/void`, { method: "POST" });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(json?.error || "Something went wrong.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="ops-btn"
        style={{ padding: "5px 10px", fontSize: 12, background: "var(--red-d)", color: "var(--red)" }}
        onClick={() => setConfirming(true)}
      >
        Void
      </button>
    );
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>Void this invoice?</span>
      <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12, background: "var(--red-d)", color: "var(--red)" }} onClick={voidInvoice} disabled={loading}>
        {loading ? "..." : "Confirm"}
      </button>
      <button
        type="button"
        className="ops-btn"
        style={{ padding: "5px 10px", fontSize: 12, background: "var(--card2)", color: "var(--text)" }}
        onClick={() => setConfirming(false)}
        disabled={loading}
      >
        Cancel
      </button>
      {error && <span style={{ color: "var(--red)", fontSize: 11 }}>{error}</span>}
    </span>
  );
}
