"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toKobo } from "@/lib/money";
import { conditionLabel } from "@/lib/vehicle-display";
import { stageLabel, stageBadgeClass } from "@/lib/ops/vehicle-stage";
import { VehiclePhotoManager } from "@/components/ops/VehiclePhotoManager";
import { USE_CATEGORY_LABELS } from "@/types";
import type { AcquisitionChannel, FuelType, LifecycleStage, SourceRegion, VehicleCondition, VehicleUseCategory } from "@/types";

const USE_CATEGORY_OPTIONS = Object.entries(USE_CATEGORY_LABELS) as [VehicleUseCategory, string][];

interface Props {
  customers: { id: string; full_name: string }[];
}

type Step = 1 | 2 | 3 | 4;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: "Identity" },
  { step: 2, label: "Acquisition" },
  { step: 3, label: "Review" },
  { step: 4, label: "Photos" },
];

// Import-channel vehicles start at 'sourced' (the first stage of their
// shipping pipeline); every other channel starts at 'intake' — mirrors
// api/vehicles/route.ts's initialStage(), kept here too so the live preview
// can show it without a round trip.
function initialStage(channel: AcquisitionChannel): LifecycleStage {
  return channel === "import" ? "sourced" : "intake";
}

const SOURCE_REGION_LABEL: Record<SourceRegion, string> = {
  usa: "USA",
  europe: "Europe",
  china: "China",
  nigeria: "Nigeria",
};

export function VehicleIntakeForm({ customers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Step 1 — identity
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [colour, setColour] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("petrol");
  const [engineCc, setEngineCc] = useState("");
  const [batteryRangeKm, setBatteryRangeKm] = useState("");
  const [sourceRegion, setSourceRegion] = useState<SourceRegion>("usa");
  const [sourceDetail, setSourceDetail] = useState("");
  const [condition, setCondition] = useState<VehicleCondition>("used");
  const [useCategories, setUseCategories] = useState<VehicleUseCategory[]>([]);

  function toggleUseCategory(cat: VehicleUseCategory) {
    setUseCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  // Step 2 — acquisition
  const [channel, setChannel] = useState<AcquisitionChannel>("import");
  const [purchasePriceUsd, setPurchasePriceUsd] = useState("");
  const [shippingCostUsd, setShippingCostUsd] = useState("");
  const [customsDutyNaira, setCustomsDutyNaira] = useState("");
  const [costBasisNaira, setCostBasisNaira] = useState("");
  const [consignorId, setConsignorId] = useState("");
  const [commissionPct, setCommissionPct] = useState("15");
  const [tradeInCreditNaira, setTradeInCreditNaira] = useState("");
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);

  function next() {
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }
  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  // Creates the vehicle, then advances to the Photos step instead of
  // navigating away immediately — photos can only be uploaded once a
  // vehicle id exists (see api/vehicles/[id]/photos/route.ts), so this is
  // the earliest point they can be attached.
  async function createVehicle() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year, 10),
          vin: vin || null,
          lot_number: lotNumber || null,
          colour: colour || null,
          fuel_type: fuelType,
          engine_cc: fuelType === "electric" ? null : engineCc ? parseInt(engineCc, 10) : null,
          battery_range_km: fuelType === "electric" && batteryRangeKm ? parseInt(batteryRangeKm, 10) : null,
          source_region: sourceRegion,
          source_detail: sourceDetail || null,
          condition,
          use_categories: useCategories,
          acquisition_channel: channel,
          purchase_price_usd_cents: channel === "import" && purchasePriceUsd ? Math.round(parseFloat(purchasePriceUsd) * 100) : null,
          shipping_cost_usd_cents: channel === "import" && shippingCostUsd ? Math.round(parseFloat(shippingCostUsd) * 100) : null,
          customs_duty_kobo: channel === "import" && customsDutyNaira ? toKobo(parseFloat(customsDutyNaira)) : null,
          cost_basis_kobo: channel !== "import" && costBasisNaira ? toKobo(parseFloat(costBasisNaira)) : null,
          consignor_customer_id: channel === "consignment" ? consignorId || null : null,
          consignment_commission_pct: channel === "consignment" && commissionPct ? parseFloat(commissionPct) : null,
          trade_in_credit_kobo: channel === "trade_in" && tradeInCreditNaira ? toKobo(parseFloat(tradeInCreditNaira)) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setCreatedVehicleId(json.vehicle.id);
      setStatus("idle");
      setStep(4);
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  const stage = initialStage(channel);

  return (
    <div className="ops-intake-layout">
      <div className="ops-panel">
        <div className="ops-stage-bar">
          {STEPS.map((s) => (
            <span
              key={s.step}
              className={`ops-stage-dot ${step === s.step ? "active" : step > s.step ? "done" : ""}`}
            >
              {s.step}. {s.label}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="ops-panel-title">Vehicle Identity</div>
            <div className="ops-form-grid">
              <div>
                <label className="ops-field-label" htmlFor="in-make">Make</label>
                <input id="in-make" className="ops-input" value={make} onChange={(e) => setMake(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-model">Model</label>
                <input id="in-model" className="ops-input" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-year">Year</label>
                <input id="in-year" className="ops-input" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-vin">VIN (optional)</label>
                <input id="in-vin" className="ops-input" value={vin} onChange={(e) => setVin(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-lot">Lot Number (optional — auction reference)</label>
                <input id="in-lot" className="ops-input" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-colour">Colour</label>
                <input id="in-colour" className="ops-input" value={colour} onChange={(e) => setColour(e.target.value)} />
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-fuel">Fuel Type</label>
                <select id="in-fuel" className="ops-input" value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              {fuelType === "electric" ? (
                <div>
                  <label className="ops-field-label" htmlFor="in-range">Battery Range (km)</label>
                  <input id="in-range" className="ops-input" type="number" value={batteryRangeKm} onChange={(e) => setBatteryRangeKm(e.target.value)} />
                </div>
              ) : (
                <div>
                  <label className="ops-field-label" htmlFor="in-engine">Engine Size (cc)</label>
                  <input id="in-engine" className="ops-input" type="number" value={engineCc} onChange={(e) => setEngineCc(e.target.value)} />
                </div>
              )}
              <div>
                <label className="ops-field-label" htmlFor="in-source">Source Region</label>
                <select id="in-source" className="ops-input" value={sourceRegion} onChange={(e) => setSourceRegion(e.target.value as SourceRegion)}>
                  <option value="usa">USA</option>
                  <option value="europe">Europe</option>
                  <option value="china">China</option>
                  <option value="nigeria">Nigeria</option>
                </select>
              </div>
              <div>
                <label className="ops-field-label" htmlFor="in-source-detail">Source Detail (optional)</label>
                <input id="in-source-detail" className="ops-input" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} />
              </div>
            </div>

            <label className="ops-field-label" htmlFor="in-condition">Condition</label>
            <select id="in-condition" className="ops-input" value={condition} onChange={(e) => setCondition(e.target.value as VehicleCondition)}>
              {/* "Tokunbo" specifically means foreign-used — wrong label for a
                  Nigerian-sourced vehicle, so it's derived from the Source
                  Region picked above (see lib/vehicle-display.ts). */}
              <option value="used">{sourceRegion === "nigeria" ? "Used (Nigerian Used)" : "Used (Tokunbo)"}</option>
              <option value="new">Brand New</option>
            </select>

            <label className="ops-field-label">Use Categories (optional — select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", marginBottom: 16 }}>
              {USE_CATEGORY_OPTIONS.map(([value, label]) => (
                <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--text)" }}>
                  <input type="checkbox" checked={useCategories.includes(value)} onChange={() => toggleUseCategory(value)} />
                  {label}
                </label>
              ))}
            </div>

            <button className="ops-btn" onClick={next} disabled={!make || !model || !year}>
              Next: Acquisition
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="ops-panel-title">Acquisition</div>
            <label className="ops-field-label" htmlFor="in-channel">Channel</label>
            <select id="in-channel" className="ops-input" value={channel} onChange={(e) => setChannel(e.target.value as AcquisitionChannel)}>
              <option value="import">Import</option>
              <option value="local_outright">Local Outright Purchase</option>
              <option value="consignment">Consignment</option>
              <option value="trade_in">Trade-In</option>
            </select>

            {channel === "import" ? (
              <>
                <div className="ops-form-grid">
                  <div>
                    <label className="ops-field-label" htmlFor="in-purchase">Purchase Price (USD)</label>
                    <input id="in-purchase" className="ops-input" type="number" value={purchasePriceUsd} onChange={(e) => setPurchasePriceUsd(e.target.value)} />
                  </div>
                  <div>
                    <label className="ops-field-label" htmlFor="in-shipping">Shipping Cost (USD)</label>
                    <input id="in-shipping" className="ops-input" type="number" value={shippingCostUsd} onChange={(e) => setShippingCostUsd(e.target.value)} />
                  </div>
                </div>
                <label className="ops-field-label" htmlFor="in-duty">Customs Duty (₦)</label>
                <input id="in-duty" className="ops-input" type="number" value={customsDutyNaira} onChange={(e) => setCustomsDutyNaira(e.target.value)} />
              </>
            ) : (
              <>
                <label className="ops-field-label" htmlFor="in-cost-basis">Acquisition Cost (₦)</label>
                <input id="in-cost-basis" className="ops-input" type="number" value={costBasisNaira} onChange={(e) => setCostBasisNaira(e.target.value)} />
              </>
            )}

            {channel === "consignment" && (
              <>
                <label className="ops-field-label" htmlFor="in-consignor">Consignor</label>
                <select id="in-consignor" className="ops-input" value={consignorId} onChange={(e) => setConsignorId(e.target.value)}>
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <label className="ops-field-label" htmlFor="in-commission">Commission (%)</label>
                <input id="in-commission" className="ops-input" type="number" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} />
              </>
            )}

            {channel === "trade_in" && (
              <>
                <label className="ops-field-label" htmlFor="in-trade-credit">Trade-In Credit (₦)</label>
                <input id="in-trade-credit" className="ops-input" type="number" value={tradeInCreditNaira} onChange={(e) => setTradeInCreditNaira(e.target.value)} />
              </>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
              <button className="ops-btn" onClick={next}>Next: Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="ops-panel-title">Review &amp; Submit</div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Check the summary on the right, then create the vehicle. You&apos;ll add photos on
              the next step; condition report and title verification come after that.
            </p>
            <p style={{ fontSize: 12, color: "var(--amber)", margin: "0 0 18px" }}>
              It&apos;s created unpublished — a vehicle needs 10 photos covering every required
              angle before it can go live on the marketing site or be certified. You can publish
              it from the vehicle page once that&apos;s done.
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
              <button className="ops-btn" onClick={createVehicle} disabled={status === "saving"}>
                {status === "saving" ? "Creating..." : "Create Vehicle →"}
              </button>
            </div>
            {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>}
          </div>
        )}

        {step === 4 && createdVehicleId && (
          <div>
            <div className="ops-panel-title">Add Photos</div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Vehicle created. Upload photos now, or skip and add them later from the vehicle
              page — condition report, title verification, and certification also happen there.
            </p>
            <VehiclePhotoManager vehicleId={createdVehicleId} initialPhotos={[]} />
            <button
              className="ops-btn"
              style={{ marginTop: 14 }}
              onClick={() => router.push(`/ops/vehicles/${createdVehicleId}`)}
            >
              Finish → Go to Vehicle
            </button>
          </div>
        )}
      </div>

      <div className="ops-panel ops-intake-preview">
        <div className="ops-panel-title">Vehicle Preview</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
          {make || model || year ? `${year} ${make} ${model}`.trim() : "New Vehicle"}
        </div>
        {(vin || lotNumber) && (
          <div style={{ fontSize: 12, color: "var(--subtle)", marginBottom: 14 }}>
            {vin && `VIN: ${vin}`}
            {vin && lotNumber && " · "}
            {lotNumber && `Lot: ${lotNumber}`}
          </div>
        )}

        <div className="ops-info-row">
          <span className="ops-info-label">Colour</span>
          <span className="ops-info-value" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ width: 12, height: 12, borderRadius: "50%", background: colour || "transparent", border: "1px solid var(--border)", display: "inline-block" }}
            />
            {colour || "—"}
          </span>
        </div>
        <div className="ops-info-row">
          <span className="ops-info-label">{fuelType === "electric" ? "Range" : "Engine"}</span>
          <span className="ops-info-value">
            {fuelType === "electric" ? (batteryRangeKm ? `${batteryRangeKm} km` : "—") : engineCc ? `${engineCc}cc` : "—"}
          </span>
        </div>
        <div className="ops-info-row">
          <span className="ops-info-label">Source</span>
          <span className="ops-info-value">{SOURCE_REGION_LABEL[sourceRegion]}</span>
        </div>
        <div className="ops-info-row">
          <span className="ops-info-label">Condition</span>
          <span className={`ops-badge ${condition === "new" ? "ops-badge-blue" : sourceRegion === "nigeria" ? "ops-badge-green" : "ops-badge-muted"}`}>
            {conditionLabel({ condition, source_region: sourceRegion })}
          </span>
        </div>
        {useCategories.length > 0 && (
          <div className="ops-info-row">
            <span className="ops-info-label">Use Categories</span>
            <span className="ops-info-value">{useCategories.map((c) => USE_CATEGORY_LABELS[c]).join(", ")}</span>
          </div>
        )}
        <div className="ops-info-row">
          <span className="ops-info-label">Channel</span>
          <span className="ops-info-value" style={{ textTransform: "capitalize" }}>{channel.replace("_", " ")}</span>
        </div>
        <div className="ops-info-row">
          <span className="ops-info-label">Starting Stage</span>
          <span className={`ops-badge ${stageBadgeClass(stage)}`}>{stageLabel(stage)}</span>
        </div>
      </div>
    </div>
  );
}
