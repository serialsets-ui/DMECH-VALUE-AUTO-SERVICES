"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, fromKobo, toKobo } from "@/lib/money";
import type { PaymentMethod, PaymentStatus } from "@/types";

export interface PaymentTableRow {
  id: string;
  instalment_id: string;
  payment_number: number | null;
  amount_kobo: number;
  amount_paid_kobo: number | null;
  due_date: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  customerName: string;
  vehicleLabel: string;
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  paid: "ops-badge-green",
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

// Record Payment lives directly on the central Payments list now, not just
// on each instalment's own detail page -- previously recording a payment
// meant clicking into the specific instalment, finding the matching row in
// its schedule, then acting there. Same recurring friction every month for
// every active instalment, which is what prompted this.
export function PaymentsTable({
  payments,
  canEdit,
  receiptIdByPaymentId,
}: {
  payments: PaymentTableRow[];
  canEdit: boolean;
  receiptIdByPaymentId: Record<string, string>;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [newReceiptIds, setNewReceiptIds] = useState<Record<string, string>>({});

  function openRow(e: React.MouseEvent, p: PaymentTableRow) {
    e.stopPropagation();
    setOpenId(p.id);
    const remainingKobo = p.amount_kobo - (p.amount_paid_kobo ?? 0);
    setAmount(String(Math.round(fromKobo(Math.max(remainingKobo, 0)))));
    setMethod("bank_transfer");
    setPaidDate(new Date().toISOString().slice(0, 10));
    setStatus("idle");
    setError(null);
  }

  async function submit(e: React.MouseEvent, paymentId: string) {
    e.stopPropagation();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_received_kobo: toKobo(parseFloat(amount)),
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
        setNewReceiptIds((prev) => ({ ...prev, [paymentId]: json.receiptId }));
      }
      setOpenId(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <>
      {payments.map((p) => {
        const receiptId = newReceiptIds[p.id] ?? receiptIdByPaymentId[p.id] ?? null;
        return (
          <Fragment key={p.id}>
            <tr className="ops-row-link" onClick={() => router.push(`/ops/instalments/${p.instalment_id}`)}>
              <td>{p.customerName}</td>
              <td>{p.vehicleLabel}</td>
              <td>{p.payment_number ?? "—"}</td>
              <td>
                {formatNaira(p.amount_kobo)}
                {p.status === "partial" && p.amount_paid_kobo ? (
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{formatNaira(p.amount_paid_kobo)} received so far</div>
                ) : null}
              </td>
              <td>{new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
              <td style={{ textTransform: "capitalize" }}>{p.payment_method?.replace("_", " ") ?? "—"}</td>
              <td>
                <span className={`ops-badge ${STATUS_CLASS[p.status] ?? "ops-badge-muted"}`}>{p.status}</span>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {canEdit && p.status !== "paid" && openId !== p.id && (
                    <button type="button" className="ops-btn" style={{ padding: "5px 10px", fontSize: 12 }} onClick={(e) => openRow(e, p)}>
                      Record Payment
                    </button>
                  )}
                  {receiptId && (
                    <a href={`/api/invoices/${receiptId}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}>
                      Receipt →
                    </a>
                  )}
                </span>
              </td>
            </tr>
            {openId === p.id && (
              <tr onClick={(e) => e.stopPropagation()}>
                <td colSpan={8} style={{ background: "var(--card2)", padding: 14 }}>
                  <div className="ops-form-grid">
                    <div>
                      <label className="ops-field-label" htmlFor={`gp-amt-${p.id}`}>Amount Received Now (₦)</label>
                      <input
                        id={`gp-amt-${p.id}`}
                        className="ops-input"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="ops-field-label" htmlFor={`gp-date-${p.id}`}>Paid Date</label>
                      <input
                        id={`gp-date-${p.id}`}
                        className="ops-input"
                        type="date"
                        value={paidDate}
                        onChange={(e) => setPaidDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <label className="ops-field-label" htmlFor={`gp-method-${p.id}`}>Payment Method</label>
                  <select
                    id={`gp-method-${p.id}`}
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
                    <button className="ops-btn" onClick={(e) => submit(e, p.id)} disabled={status === "saving" || !amount}>
                      {status === "saving" ? "Saving..." : "Save Payment"}
                    </button>
                    <button
                      type="button"
                      className="ops-btn"
                      style={{ background: "var(--card2)", color: "var(--text)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(null);
                      }}
                    >
                      Cancel
                    </button>
                    {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
