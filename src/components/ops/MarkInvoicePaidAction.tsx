"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@/types";

export function MarkInvoicePaidAction({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markPaid() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_method: method, paid_date: paidDate }),
    });
    const json = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(json?.error || "Something went wrong.");
      return;
    }
    if (json?.receiptId) {
      window.open(`/api/invoices/${json.receiptId}/pdf`, "_blank");
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setOpen(true)}>
        Mark Paid
      </button>
    );
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        className="ops-input"
        style={{ marginBottom: 0, padding: "4px 6px", fontSize: 12, width: "auto" }}
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
      >
        <option value="bank_transfer">Bank Transfer</option>
        <option value="paystack">Paystack</option>
        <option value="pos">POS</option>
        <option value="cash">Cash</option>
      </select>
      <input
        type="date"
        className="ops-input"
        style={{ marginBottom: 0, padding: "4px 6px", fontSize: 12, width: "auto" }}
        value={paidDate}
        onChange={(e) => setPaidDate(e.target.value)}
      />
      <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12 }} onClick={markPaid} disabled={loading}>
        {loading ? "..." : "Confirm"}
      </button>
      <button
        type="button"
        className="ops-btn"
        style={{ padding: "5px 10px", fontSize: 12, background: "var(--card2)", color: "var(--text)" }}
        onClick={() => setOpen(false)}
        disabled={loading}
      >
        Cancel
      </button>
      {error && <span style={{ color: "var(--red)", fontSize: 11 }}>{error}</span>}
    </span>
  );
}
