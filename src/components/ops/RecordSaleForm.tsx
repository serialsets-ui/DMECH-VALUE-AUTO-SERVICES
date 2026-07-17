"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AcquisitionChannel, CertificationStatus, PaymentMethod } from "@/types";

interface Props {
  vehicleId: string;
  acquisitionChannel: AcquisitionChannel;
  certificationStatus: CertificationStatus;
  customers: { id: string; full_name: string }[];
}

export function RecordSaleForm({ vehicleId, acquisitionChannel, certificationStatus, customers }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [paidInFull, setPaidInFull] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  async function recordSale() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          paid_in_full: paidInFull,
          payment_method: paidInFull ? paymentMethod : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      if (json.invoiceId) setInvoiceUrl(`/api/invoices/${json.invoiceId}/pdf`);
      if (json.receiptId) setReceiptUrl(`/api/invoices/${json.receiptId}/pdf`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Record Sale</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        Marks this vehicle sold at its current sale price and generates a sale invoice.
        {acquisitionChannel === "consignment" && " The consignor payout will be computed and recorded automatically."}
        {certificationStatus === "certified" && " The warranty reserve accrual will be recorded automatically."}
      </p>

      <label className="ops-field-label" htmlFor="sale-customer">Buyer</label>
      <select id="sale-customer" className="ops-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Select customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.full_name}</option>
        ))}
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: paidInFull ? 8 : 16, fontSize: 13.5, color: "var(--text)" }}>
        <input type="checkbox" checked={paidInFull} onChange={(e) => setPaidInFull(e.target.checked)} />
        Customer paid in full at this time — also generate a receipt
      </label>
      {paidInFull && (
        <>
          <label className="ops-field-label" htmlFor="sale-payment-method">Payment Method</label>
          <select
            id="sale-payment-method"
            className="ops-input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paystack">Paystack</option>
            <option value="pos">POS</option>
            <option value="cash">Cash</option>
          </select>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={recordSale} disabled={status === "saving" || !customerId}>
          {status === "saving" ? "Recording..." : "Mark as Sold"}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
      {(invoiceUrl || receiptUrl) && (
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          {invoiceUrl && (
            <a className="ops-btn" style={{ display: "inline-block", textDecoration: "none" }} href={invoiceUrl} target="_blank" rel="noopener noreferrer">
              Download Sale Invoice (PDF)
            </a>
          )}
          {receiptUrl && (
            <a className="ops-btn" style={{ display: "inline-block", textDecoration: "none", background: "var(--green-d)", color: "var(--green)" }} href={receiptUrl} target="_blank" rel="noopener noreferrer">
              Download Receipt (PDF)
            </a>
          )}
        </div>
      )}
    </div>
  );
}
