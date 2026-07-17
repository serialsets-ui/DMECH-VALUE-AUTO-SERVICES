"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkInvoicePaidAction({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(json?.error || "Something went wrong.");
      return;
    }
    if (json?.receiptId) {
      window.open(`/api/invoices/${json.receiptId}/pdf`, "_blank");
    }
    router.refresh();
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12 }} onClick={markPaid} disabled={loading}>
        {loading ? "..." : "Mark Paid"}
      </button>
      {error && <span style={{ color: "var(--red)", fontSize: 11 }}>{error}</span>}
    </span>
  );
}
