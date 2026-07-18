"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";
import type { ApprovalTierThresholds } from "@/lib/approval";

interface PartsCreditLimits {
  retail: number;
  wholesale_auto: number;
  wholesale_manual: number;
}

interface Props {
  ngnUsdRate: number;
  dmechServiceFeePct: number;
  defaultDepositPct: number;
  defaultTenorMonths: number;
  reservationHoldHours: number;
  maxSelfFinanceKobo: number;
  warrantyReserveContributionPct: number;
  approvalTierThresholds: ApprovalTierThresholds;
  partsCreditLimits: PartsCreditLimits;
  reminderDays: number[];
}

type Status = "idle" | "saving" | "saved" | "error";

export function PlatformSettingsForm(props: Props) {
  const router = useRouter();
  const [ngnUsdRate, setNgnUsdRate] = useState(String(props.ngnUsdRate));
  const [serviceFeePct, setServiceFeePct] = useState(String(props.dmechServiceFeePct));
  const [depositPct, setDepositPct] = useState(String(props.defaultDepositPct));
  const [tenorMonths, setTenorMonths] = useState(String(props.defaultTenorMonths));
  const [holdHours, setHoldHours] = useState(String(props.reservationHoldHours));
  const [maxSelfFinanceNaira, setMaxSelfFinanceNaira] = useState(String(Math.round(fromKobo(props.maxSelfFinanceKobo))));
  const [reservePct, setReservePct] = useState(String(props.warrantyReserveContributionPct));
  const [tier1Naira, setTier1Naira] = useState(String(Math.round(fromKobo(props.approvalTierThresholds.tier1_max))));
  const [tier2Naira, setTier2Naira] = useState(String(Math.round(fromKobo(props.approvalTierThresholds.tier2_max))));
  const [tier3Naira, setTier3Naira] = useState(String(Math.round(fromKobo(props.approvalTierThresholds.tier3_max))));
  const [retailNaira, setRetailNaira] = useState(String(Math.round(fromKobo(props.partsCreditLimits.retail))));
  const [wholesaleAutoNaira, setWholesaleAutoNaira] = useState(String(Math.round(fromKobo(props.partsCreditLimits.wholesale_auto))));
  const [wholesaleManualNaira, setWholesaleManualNaira] = useState(String(Math.round(fromKobo(props.partsCreditLimits.wholesale_manual))));
  const [reminderDays, setReminderDays] = useState(props.reminderDays.join(", "));
  const [status, setStatus] = useState<Status>("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/settings/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ngn_usd_rate: parseFloat(ngnUsdRate),
          dmech_service_fee_pct: parseFloat(serviceFeePct),
          default_deposit_pct: parseFloat(depositPct),
          default_tenor_months: parseInt(tenorMonths, 10),
          reservation_hold_hours: parseInt(holdHours, 10),
          max_self_finance_kobo: toKobo(parseFloat(maxSelfFinanceNaira)),
          warranty_reserve_contribution_pct: parseFloat(reservePct),
          approval_tier_thresholds_kobo: {
            tier1_max: toKobo(parseFloat(tier1Naira)),
            tier2_max: toKobo(parseFloat(tier2Naira)),
            tier3_max: toKobo(parseFloat(tier3Naira)),
          },
          parts_credit_limits: {
            retail: toKobo(parseFloat(retailNaira)),
            wholesale_auto: toKobo(parseFloat(wholesaleAutoNaira)),
            wholesale_manual: toKobo(parseFloat(wholesaleManualNaira)),
          },
          reminder_days: reminderDays.split(",").map((d) => parseInt(d.trim(), 10)).filter((d) => !isNaN(d)),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="ops-grid-2">
        <div className="ops-panel">
          <div className="ops-panel-title">Financial Defaults</div>
          <div className="ops-form-grid">
            <div>
              <label className="ops-field-label" htmlFor="ps-ngn">NGN/USD Rate</label>
              <input id="ps-ngn" className="ops-input" type="number" value={ngnUsdRate} onChange={(e) => setNgnUsdRate(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-fee">DMECH Service Fee (%)</label>
              <input id="ps-fee" className="ops-input" type="number" value={serviceFeePct} onChange={(e) => setServiceFeePct(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-deposit">Default Deposit (%)</label>
              <input id="ps-deposit" className="ops-input" type="number" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-tenor">Default Tenor (months)</label>
              <input id="ps-tenor" className="ops-input" type="number" value={tenorMonths} onChange={(e) => setTenorMonths(e.target.value)} />
            </div>
          </div>
          <label className="ops-field-label" htmlFor="ps-max-finance">Max Self-Finance (₦)</label>
          <input id="ps-max-finance" className="ops-input" type="number" value={maxSelfFinanceNaira} onChange={(e) => setMaxSelfFinanceNaira(e.target.value)} />
        </div>

        <div className="ops-panel">
          <div className="ops-panel-title">Operations &amp; Reminders</div>
          <div className="ops-form-grid">
            <div>
              <label className="ops-field-label" htmlFor="ps-hold">Reservation Hold (hours)</label>
              <input id="ps-hold" className="ops-input" type="number" value={holdHours} onChange={(e) => setHoldHours(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-reserve">Warranty Reserve Contribution (%)</label>
              <input id="ps-reserve" className="ops-input" type="number" value={reservePct} onChange={(e) => setReservePct(e.target.value)} />
            </div>
          </div>
          <label className="ops-field-label" htmlFor="ps-reminders">Payment Reminder Days (comma-separated)</label>
          <input id="ps-reminders" className="ops-input" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />
        </div>

        <div className="ops-panel">
          <div className="ops-panel-title">Customer Approval Tiers (₦)</div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
            Requested credit at or below Tier 1&apos;s value needs one staff approval; above Tier
            2&apos;s value needs two.
          </p>
          <div className="ops-form-grid">
            <div>
              <label className="ops-field-label" htmlFor="ps-tier1">Tier 1 Max</label>
              <input id="ps-tier1" className="ops-input" type="number" value={tier1Naira} onChange={(e) => setTier1Naira(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-tier2">Tier 2 Max</label>
              <input id="ps-tier2" className="ops-input" type="number" value={tier2Naira} onChange={(e) => setTier2Naira(e.target.value)} />
            </div>
          </div>
          <label className="ops-field-label" htmlFor="ps-tier3">Tier 3 Max (above this is Tier 4)</label>
          <input id="ps-tier3" className="ops-input" type="number" value={tier3Naira} onChange={(e) => setTier3Naira(e.target.value)} />
        </div>

        <div className="ops-panel">
          <div className="ops-panel-title">Parts Credit Limits (₦)</div>
          <div className="ops-form-grid">
            <div>
              <label className="ops-field-label" htmlFor="ps-retail">Retail</label>
              <input id="ps-retail" className="ops-input" type="number" value={retailNaira} onChange={(e) => setRetailNaira(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="ps-wholesale-auto">Wholesale (Auto)</label>
              <input id="ps-wholesale-auto" className="ops-input" type="number" value={wholesaleAutoNaira} onChange={(e) => setWholesaleAutoNaira(e.target.value)} />
            </div>
          </div>
          <label className="ops-field-label" htmlFor="ps-wholesale-manual">Wholesale (Manual Review)</label>
          <input id="ps-wholesale-manual" className="ops-input" type="number" value={wholesaleManualNaira} onChange={(e) => setWholesaleManualNaira(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <button className="ops-btn" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {status === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {status === "error" && <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>}
      </div>
    </div>
  );
}
