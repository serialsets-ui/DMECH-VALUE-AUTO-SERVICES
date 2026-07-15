"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, fromKobo, toKobo } from "@/lib/money";
import type { Payment, PaymentMethod } from "@/types";

const STATUS_CLASS: Record<string, string> = {
  paid: "ops-badge-green",
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

export function PaymentSchedule({ payments, canEdit }: { payments: Payment[]; canEdit: boolean }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});

  function openRow(p: Payment) {
    setOpenId(p.id);
    setAmount(String(Math.round(fromKobo(p.amount_kobo))));
    setMethod("bank_transfer");
    setPaidDate(new Date().toISOString().slice(0, 10));
    setStatus("idle");
    setError(null);
  }

  async function submit(paymentId: string) {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_paid_kobo: toKobo(parseFloat(amount)),
          payment_method: method,
          paid_date: paidDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      if (json.receiptId) {
        setReceiptUrls((prev) => ({ ...prev, [paymentId]: `/api/invoices/${json.receiptId}/pdf` }));
      }
      setOpenId(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  if (payments.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: 13 }}>No payments recorded yet.</div>;
  }

  return (
    <div>
      {payments.map((p) => (
        <div key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="ops-info-row" style={{ border: "none" }}>
            <span className="ops-info-label">
              #{p.payment_number ?? "—"} · Due {new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="ops-info-value">{formatNaira(p.amount_kobo)}</span>
              <span className={`ops-badge ${STATUS_CLASS[p.status] ?? "ops-badge-muted"}`}>{p.status}</span>
              {canEdit && p.status !== "paid" && openId !== p.id && (
                <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => openRow(p)}>
                  Record Payment
                </button>
              )}
              {receiptUrls[p.id] && (
                <a href={receiptUrls[p.id]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}>
                  Receipt →
                </a>
              )}
            </span>
          </div>

          {openId === p.id && (
            <div style={{ padding: "0 0 14px" }}>
              <div className="ops-form-grid">
                <div>
                  <label className="ops-field-label" htmlFor={`pay-amt-${p.id}`}>Amount Received (₦)</label>
                  <input
                    id={`pay-amt-${p.id}`}
                    className="ops-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="ops-field-label" htmlFor={`pay-date-${p.id}`}>Paid Date</label>
                  <input
                    id={`pay-date-${p.id}`}
                    className="ops-input"
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                  />
                </div>
              </div>
              <label className="ops-field-label" htmlFor={`pay-method-${p.id}`}>Payment Method</label>
              <select
                id={`pay-method-${p.id}`}
                className="ops-input"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paystack">Paystack</option>
                <option value="pos">POS</option>
                <option value="cash">Cash</option>
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="ops-btn" onClick={() => submit(p.id)} disabled={status === "saving" || !amount}>
                  {status === "saving" ? "Saving..." : "Save Payment"}
                </button>
                <button
                  type="button"
                  className="ops-btn"
                  style={{ background: "var(--card2)", color: "var(--text)" }}
                  onClick={() => setOpenId(null)}
                >
                  Cancel
                </button>
                {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
