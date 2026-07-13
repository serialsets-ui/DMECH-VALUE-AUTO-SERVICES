"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toKobo } from "@/lib/money";
import type { AcquisitionChannel, FuelType, SourceRegion, VehicleCondition } from "@/types";

interface Props {
  customers: { id: string; full_name: string }[];
}

type Step = 1 | 2 | 3;

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

  // Step 2 — acquisition
  const [channel, setChannel] = useState<AcquisitionChannel>("import");
  const [purchasePriceUsd, setPurchasePriceUsd] = useState("");
  const [shippingCostUsd, setShippingCostUsd] = useState("");
  const [customsDutyNaira, setCustomsDutyNaira] = useState("");
  const [costBasisNaira, setCostBasisNaira] = useState("");
  const [consignorId, setConsignorId] = useState("");
  const [commissionPct, setCommissionPct] = useState("15");
  const [tradeInCreditNaira, setTradeInCreditNaira] = useState("");

  function next() {
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }
  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function submit() {
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
      router.push(`/ops/vehicles/${json.vehicle.id}`);
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel" style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 12, color: "var(--subtle)", marginBottom: 16 }}>Step {step} of 3</div>

      {step === 1 && (
        <div>
          <div className="ops-panel-title">Vehicle Identity</div>
          <label className="ops-field-label" htmlFor="in-make">Make</label>
          <input id="in-make" className="ops-input" value={make} onChange={(e) => setMake(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-model">Model</label>
          <input id="in-model" className="ops-input" value={model} onChange={(e) => setModel(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-year">Year</label>
          <input id="in-year" className="ops-input" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-vin">VIN (optional)</label>
          <input id="in-vin" className="ops-input" value={vin} onChange={(e) => setVin(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-lot">Lot Number (optional — auction reference)</label>
          <input id="in-lot" className="ops-input" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-colour">Colour</label>
          <input id="in-colour" className="ops-input" value={colour} onChange={(e) => setColour(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-fuel">Fuel Type</label>
          <select id="in-fuel" className="ops-input" value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
          {fuelType === "electric" ? (
            <>
              <label className="ops-field-label" htmlFor="in-range">Battery Range (km)</label>
              <input id="in-range" className="ops-input" type="number" value={batteryRangeKm} onChange={(e) => setBatteryRangeKm(e.target.value)} />
            </>
          ) : (
            <>
              <label className="ops-field-label" htmlFor="in-engine">Engine Size (cc)</label>
              <input id="in-engine" className="ops-input" type="number" value={engineCc} onChange={(e) => setEngineCc(e.target.value)} />
            </>
          )}
          <label className="ops-field-label" htmlFor="in-source">Source Region</label>
          <select id="in-source" className="ops-input" value={sourceRegion} onChange={(e) => setSourceRegion(e.target.value as SourceRegion)}>
            <option value="usa">USA</option>
            <option value="europe">Europe</option>
            <option value="china">China</option>
            <option value="nigeria">Nigeria</option>
          </select>
          <label className="ops-field-label" htmlFor="in-source-detail">Source Detail (optional)</label>
          <input id="in-source-detail" className="ops-input" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} />
          <label className="ops-field-label" htmlFor="in-condition">Condition</label>
          <select id="in-condition" className="ops-input" value={condition} onChange={(e) => setCondition(e.target.value as VehicleCondition)}>
            {/* "Tokunbo" specifically means foreign-used — wrong label for a
                Nigerian-sourced vehicle, so it's derived from the Source
                Region picked above (see lib/vehicle-display.ts). */}
            <option value="used">{sourceRegion === "nigeria" ? "Used (Nigerian Used)" : "Used (Tokunbo)"}</option>
            <option value="new">Brand New</option>
          </select>

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
              <label className="ops-field-label" htmlFor="in-purchase">Purchase Price (USD)</label>
              <input id="in-purchase" className="ops-input" type="number" value={purchasePriceUsd} onChange={(e) => setPurchasePriceUsd(e.target.value)} />
              <label className="ops-field-label" htmlFor="in-shipping">Shipping Cost (USD)</label>
              <input id="in-shipping" className="ops-input" type="number" value={shippingCostUsd} onChange={(e) => setShippingCostUsd(e.target.value)} />
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
          <div className="ops-info-row"><span className="ops-info-label">Vehicle</span><span className="ops-info-value">{year} {make} {model}</span></div>
          <div className="ops-info-row"><span className="ops-info-label">Channel</span><span className="ops-info-value">{channel}</span></div>
          <div className="ops-info-row"><span className="ops-info-label">Starting Stage</span><span className="ops-info-value">{channel === "import" ? "Sourced" : "Intake"}</span></div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "12px 0" }}>
            You can add photos, condition report, and title verification once the vehicle is created.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
            <button className="ops-btn" onClick={submit} disabled={status === "saving"}>
              {status === "saving" ? "Creating..." : "Create Vehicle"}
            </button>
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
