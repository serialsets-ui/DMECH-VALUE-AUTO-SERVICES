"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toKobo } from "@/lib/money";
import { photoRequirementStatus } from "@/lib/vehicle-display";
import type { CertificationStatus, TitleVerificationCheck, VehiclePhoto } from "@/types";

interface ConditionItem {
  area: string;
  score: string;
  notes: string;
  photo_urls: string[];
}

interface Props {
  vehicleId: string;
  conditionReport: ConditionItem[];
  titleVerification: TitleVerificationCheck[];
  certificationStatus: CertificationStatus;
  salePriceKobo: number | null;
  photos: VehiclePhoto[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function InspectionPanel({
  vehicleId,
  conditionReport,
  titleVerification,
  certificationStatus,
  salePriceKobo,
  photos,
}: Props) {
  const router = useRouter();
  const requirement = photoRequirementStatus(photos);
  const [conditions, setConditions] = useState<ConditionItem[]>(conditionReport);
  const [checks, setChecks] = useState<TitleVerificationCheck[]>(titleVerification);
  const [inspectionStatus, setInspectionStatus] = useState<SaveStatus>("idle");

  const [coverageTier, setCoverageTier] = useState<"basic" | "extended">("basic");
  const [durationDays, setDurationDays] = useState("180");
  const [mileageLimit, setMileageLimit] = useState("");
  const [coveredComponents, setCoveredComponents] = useState("Engine, Transmission, Electrical");
  const [warrantyPriceNaira, setWarrantyPriceNaira] = useState("0");
  const [certifyStatus, setCertifyStatus] = useState<SaveStatus>("idle");
  const [certifyError, setCertifyError] = useState<string | null>(null);

  function updateCondition(i: number, field: keyof ConditionItem, value: string) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }
  function addCondition() {
    setConditions((prev) => [...prev, { area: "", score: "Good", notes: "", photo_urls: [] }]);
  }
  function removeCondition(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCheck(i: number, field: keyof TitleVerificationCheck, value: string) {
    setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }
  function addCheck() {
    setChecks((prev) => [
      ...prev,
      { check: "", status: "pending", verified_by: null, verified_at: null, notes: "" },
    ]);
  }
  function removeCheck(i: number) {
    setChecks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveInspection() {
    setInspectionStatus("saving");
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/inspection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition_report: conditions, title_verification: checks }),
      });
      setInspectionStatus(res.ok ? "saved" : "error");
      if (res.ok) router.refresh();
    } catch {
      setInspectionStatus("error");
    }
  }

  async function certify() {
    setCertifyStatus("saving");
    setCertifyError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverage_tier: coverageTier,
          duration_days: parseInt(durationDays, 10) || 180,
          mileage_limit_km: mileageLimit ? parseInt(mileageLimit, 10) : null,
          covered_components: coveredComponents.split(",").map((c) => c.trim()).filter(Boolean),
          price_kobo: warrantyPriceNaira ? toKobo(parseFloat(warrantyPriceNaira)) : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCertifyError(json.error || "Something went wrong.");
        setCertifyStatus("error");
        return;
      }
      setCertifyStatus("saved");
      router.refresh();
    } catch {
      setCertifyError("Something went wrong.");
      setCertifyStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Inspection</div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
        Condition Report
      </div>
      {conditions.map((c, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input className="ops-input" style={{ marginBottom: 0 }} placeholder="Area (e.g. Engine)" value={c.area} onChange={(e) => updateCondition(i, "area", e.target.value)} />
          <select className="ops-input" style={{ marginBottom: 0 }} value={c.score} onChange={(e) => updateCondition(i, "score", e.target.value)}>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
          <input className="ops-input" style={{ marginBottom: 0 }} placeholder="Notes" value={c.notes} onChange={(e) => updateCondition(i, "notes", e.target.value)} />
          <button type="button" className="ops-logout-btn" onClick={() => removeCondition(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)", marginBottom: 20 }} onClick={addCondition}>
        + Add Item
      </button>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
        Title Verification
      </div>
      {checks.map((c, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input className="ops-input" style={{ marginBottom: 0 }} placeholder="Check (e.g. Lien search)" value={c.check} onChange={(e) => updateCheck(i, "check", e.target.value)} />
          <select className="ops-input" style={{ marginBottom: 0 }} value={c.status} onChange={(e) => updateCheck(i, "status", e.target.value)}>
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <input className="ops-input" style={{ marginBottom: 0 }} placeholder="Notes" value={c.notes ?? ""} onChange={(e) => updateCheck(i, "notes", e.target.value)} />
          <button type="button" className="ops-logout-btn" onClick={() => removeCheck(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)", marginBottom: 20 }} onClick={addCheck}>
        + Add Check
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="ops-btn" onClick={saveInspection} disabled={inspectionStatus === "saving"}>
          {inspectionStatus === "saving" ? "Saving..." : "Save Inspection Notes"}
        </button>
        {inspectionStatus === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {inspectionStatus === "error" && <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
          Certify &amp; Issue Warranty
        </div>
        {certificationStatus === "certified" ? (
          <div style={{ fontSize: 13, color: "var(--green)" }}>This vehicle is already certified.</div>
        ) : (
          <>
            {!requirement.met && (
              <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 10 }}>
                Needs {requirement.photosNeeded > 0 ? `${requirement.photosNeeded} more photo${requirement.photosNeeded === 1 ? "" : "s"}` : "a few more angles"}
                {requirement.missingTags.length > 0 ? ` (missing: ${requirement.missingTags.join(", ")})` : ""} before this vehicle can be certified — see the Photos panel above.
              </div>
            )}
            {!salePriceKobo && (
              <div style={{ fontSize: 12, color: "var(--amber)", marginBottom: 10 }}>
                No sale price set yet — the reserve contribution will be recorded as ₦0 until one is.
              </div>
            )}
            <label className="ops-field-label" htmlFor="cert-tier">Coverage Tier</label>
            <select id="cert-tier" className="ops-input" value={coverageTier} onChange={(e) => setCoverageTier(e.target.value as "basic" | "extended")}>
              <option value="basic">Basic</option>
              <option value="extended">Extended</option>
            </select>

            <label className="ops-field-label" htmlFor="cert-duration">Duration (days)</label>
            <input id="cert-duration" className="ops-input" type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />

            <label className="ops-field-label" htmlFor="cert-mileage">Mileage Limit (km, optional)</label>
            <input id="cert-mileage" className="ops-input" type="number" value={mileageLimit} onChange={(e) => setMileageLimit(e.target.value)} />

            <label className="ops-field-label" htmlFor="cert-components">Covered Components (comma-separated)</label>
            <input id="cert-components" className="ops-input" value={coveredComponents} onChange={(e) => setCoveredComponents(e.target.value)} />

            <label className="ops-field-label" htmlFor="cert-price">Warranty Price (₦, 0 = included free)</label>
            <input id="cert-price" className="ops-input" type="number" value={warrantyPriceNaira} onChange={(e) => setWarrantyPriceNaira(e.target.value)} />

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="ops-btn" onClick={certify} disabled={certifyStatus === "saving" || !requirement.met}>
                {certifyStatus === "saving" ? "Certifying..." : "Certify & Issue Warranty"}
              </button>
              {certifyError && <span style={{ color: "var(--red)", fontSize: 12 }}>{certifyError}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
