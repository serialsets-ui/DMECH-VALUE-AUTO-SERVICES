"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/money";
import type { InstalmentPlanType, PaymentMethod } from "@/types";

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  year: number;
  sale_price_kobo: number;
}

interface Props {
  customers: { id: string; full_name: string }[];
  vehicles: VehicleOption[];
  defaultDepositPct: number;
  defaultTenorMonths: number;
  defaultAdminFeePct: number;
}

export function InstalmentIntakeForm({ customers, vehicles, defaultDepositPct, defaultTenorMonths, defaultAdminFeePct }: Props) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [planType, setPlanType] = useState<InstalmentPlanType>("dmech_direct");
  const [depositPct, setDepositPct] = useState(String(defaultDepositPct));
  const [tenorMonths, setTenorMonths] = useState(String(defaultTenorMonths));
  const [adminFeePct, setAdminFeePct] = useState(String(defaultAdminFeePct));
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  // Mirrors the marketing site's own financing-tab estimate (VehicleDetailModal.tsx)
  // so what staff see here matches what the customer was already shown.
  const preview = useMemo(() => {
    if (!vehicle) return null;
    const deposit = parseFloat(depositPct) || 0;
    const tenor = parseInt(tenorMonths, 10) || 0;
    if (!tenor) return null;
    const depositAmount = Math.round((vehicle.sale_price_kobo * deposit) / 100);
    const monthly = Math.round((vehicle.sale_price_kobo - depositAmount) / tenor);
    return { depositAmount, monthly };
  }, [vehicle, depositPct, tenorMonths]);

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/instalments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          customer_id: customerId,
          plan_type: planType,
          deposit_pct: parseFloat(depositPct),
          tenor_months: parseInt(tenorMonths, 10),
          admin_fee_pct: planType === "dmech_direct" ? parseFloat(adminFeePct) : null,
          deposit_paid: depositPaid,
          deposit_payment_method: depositPaid ? depositPaymentMethod : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      router.push(`/ops/invoices/${json.invoiceId}`);
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  const canSubmit = vehicleId && customerId && depositPct && tenorMonths && status !== "saving";

  return (
    <div className="ops-panel" style={{ maxWidth: 560 }}>
      <div className="ops-panel-title">New Instalment Plan</div>

      <label className="ops-field-label" htmlFor="ni-vehicle">Vehicle</label>
      <select id="ni-vehicle" className="ops-input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
        <option value="">Select vehicle</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.year} {v.make} {v.model} — {formatNaira(v.sale_price_kobo)}
          </option>
        ))}
      </select>
      {vehicles.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--amber)", marginTop: -8, marginBottom: 14 }}>
          No vehicles with a sale price set are available to finance yet.
        </div>
      )}

      <label className="ops-field-label" htmlFor="ni-customer">Customer</label>
      <select id="ni-customer" className="ops-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Select customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.full_name}</option>
        ))}
      </select>

      <label className="ops-field-label" htmlFor="ni-plan">Plan Type</label>
      <select id="ni-plan" className="ops-input" value={planType} onChange={(e) => setPlanType(e.target.value as InstalmentPlanType)}>
        <option value="dmech_direct">DMECH Direct</option>
        <option value="partner_finance">Partner Finance (Autochek)</option>
      </select>

      <div className="ops-form-grid">
        <div>
          <label className="ops-field-label" htmlFor="ni-deposit">Deposit (%)</label>
          <input id="ni-deposit" className="ops-input" type="number" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
        </div>
        <div>
          <label className="ops-field-label" htmlFor="ni-tenor">Tenor (months)</label>
          <input id="ni-tenor" className="ops-input" type="number" value={tenorMonths} onChange={(e) => setTenorMonths(e.target.value)} />
        </div>
      </div>

      {planType === "dmech_direct" && (
        <>
          <label className="ops-field-label" htmlFor="ni-admin-fee">Admin Fee (%, flat)</label>
          <input id="ni-admin-fee" className="ops-input" type="number" value={adminFeePct} onChange={(e) => setAdminFeePct(e.target.value)} />
        </>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: depositPaid ? 8 : 16, fontSize: 13.5, color: "var(--text)" }}>
        <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} />
        Deposit already collected
      </label>
      {depositPaid && (
        <>
          <label className="ops-field-label" htmlFor="ni-deposit-method">Deposit Payment Method</label>
          <select
            id="ni-deposit-method"
            className="ops-input"
            value={depositPaymentMethod}
            onChange={(e) => setDepositPaymentMethod(e.target.value as PaymentMethod)}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paystack">Paystack</option>
            <option value="pos">POS</option>
            <option value="cash">Cash</option>
          </select>
        </>
      )}

      {preview && (
        <div className="ops-panel" style={{ background: "var(--card2)", padding: 14, marginBottom: 16 }}>
          <div className="ops-info-row">
            <span className="ops-info-label">Deposit Amount</span>
            <span className="ops-info-value">{formatNaira(preview.depositAmount)}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Monthly Payment</span>
            <span className="ops-info-value">{formatNaira(preview.monthly)}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={submit} disabled={!canSubmit}>
          {status === "saving" ? "Creating..." : "Create Instalment Plan"}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
