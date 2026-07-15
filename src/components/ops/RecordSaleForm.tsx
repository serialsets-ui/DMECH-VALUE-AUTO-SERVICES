"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AcquisitionChannel, CertificationStatus } from "@/types";

interface Props {
  vehicleId: string;
  acquisitionChannel: AcquisitionChannel;
  certificationStatus: CertificationStatus;
  customers: { id: string; full_name: string }[];
}

export function RecordSaleForm({ vehicleId, acquisitionChannel, certificationStatus, customers }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  async function recordSale() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      if (json.invoiceId) setInvoiceUrl(`/api/invoices/${json.invoiceId}/pdf`);
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={recordSale} disabled={status === "saving" || !customerId}>
          {status === "saving" ? "Recording..." : "Mark as Sold"}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
      {invoiceUrl && (
        <div style={{ marginTop: 12 }}>
          <a className="ops-btn" style={{ display: "inline-block", textDecoration: "none" }} href={invoiceUrl} target="_blank" rel="noopener noreferrer">
            Download Sale Invoice (PDF)
          </a>
        </div>
      )}
    </div>
  );
}
