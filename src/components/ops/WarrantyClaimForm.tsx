"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";
import type { WarrantyClaimStatus } from "@/types";

interface Props {
  claimId: string;
  status: WarrantyClaimStatus;
  assessedCostKobo: number | null;
  approvedKobo: number | null;
}

export function WarrantyClaimForm({ claimId, status, assessedCostKobo, approvedKobo }: Props) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState<WarrantyClaimStatus>(status);
  const [assessedNaira, setAssessedNaira] = useState(assessedCostKobo ? String(Math.round(fromKobo(assessedCostKobo))) : "");
  const [approvedNaira, setApprovedNaira] = useState(approvedKobo ? String(Math.round(fromKobo(approvedKobo))) : "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaveStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/warranty-claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusValue,
          assessed_cost_kobo: assessedNaira ? toKobo(parseFloat(assessedNaira)) : null,
          approved_kobo: approvedNaira ? toKobo(parseFloat(approvedNaira)) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saved");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setSaveStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Assess Claim</div>

      <label className="ops-field-label" htmlFor="claim-status">Status</label>
      <select id="claim-status" className="ops-input" value={statusValue} onChange={(e) => setStatusValue(e.target.value as WarrantyClaimStatus)}>
        <option value="submitted">Submitted</option>
        <option value="assessed">Assessed</option>
        <option value="approved">Approved</option>
        <option value="denied">Denied</option>
        <option value="paid">Paid</option>
      </select>

      <label className="ops-field-label" htmlFor="claim-assessed">Assessed Cost (₦)</label>
      <input id="claim-assessed" className="ops-input" type="number" value={assessedNaira} onChange={(e) => setAssessedNaira(e.target.value)} />

      <label className="ops-field-label" htmlFor="claim-approved">Approved Amount (₦)</label>
      <input id="claim-approved" className="ops-input" type="number" value={approvedNaira} onChange={(e) => setApprovedNaira(e.target.value)} />
      {statusValue === "approved" && (
        <p style={{ fontSize: 12, color: "var(--amber)", marginTop: -8, marginBottom: 14 }}>
          Setting status to Approved with an amount here records a payout against the warranty reserve.
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={save} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {saveStatus === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
