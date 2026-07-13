"use client";

import { useMemo, useState } from "react";
import {
  VEHICLE_CATALOG,
  catalogMakes,
  estimatedPriceForYear,
  engineSizeFromCc,
  type CatalogRegionName,
} from "@/lib/vehicle-catalog";
import { calculateLandedCost, type EngineSize, type VehicleCondition } from "@/lib/duty";
import { formatNaira, formatUsd } from "@/lib/money";
import type { DutyBreakdown } from "@/lib/duty";
import type { FuelType } from "@/types";

const REGION_FLAGS: Record<CatalogRegionName, string> = {
  USA: "🇺🇸",
  Europe: "🇪🇺",
  China: "🇨🇳",
};

// Falls back to the mockup's original defaults when platform_config isn't
// reachable yet (no Supabase project configured) — see src/lib/platform-config.ts.
interface CalculatorProps {
  ngnRate?: number;
  marketPriceBenchmarks?: Record<string, number>;
}

export function Calculator({ ngnRate = 1580, marketPriceBenchmarks = {} }: CalculatorProps) {
  const [region, setRegion] = useState<CatalogRegionName | "">("");
  const [fuel, setFuel] = useState<FuelType | "all">("all");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [condition, setCondition] = useState<VehicleCondition>("used");
  const [shipping, setShipping] = useState<number>(1500);
  const [engine, setEngine] = useState<EngineSize>("small");
  const [isEV, setIsEV] = useState(false);
  const [estimateNote, setEstimateNote] = useState<string | null>(null);

  const [result, setResult] = useState<DutyBreakdown | null>(null);
  const [phone, setPhone] = useState("");
  const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  const makes = useMemo(() => (region ? catalogMakes(region, fuel) : {}), [region, fuel]);
  const models = make && makes[make] ? makes[make] : {};

  function onRegionChange(next: string) {
    const r = next as CatalogRegionName | "";
    setRegion(r);
    setMake("");
    setModel("");
    setYear("");
    setEstimateNote(null);
    if (r) setShipping(VEHICLE_CATALOG[r].shipping);
  }

  function onFuelChange(next: string) {
    setFuel(next as FuelType | "all");
    setMake("");
    setModel("");
    setYear("");
    setEstimateNote(null);
  }

  function onMakeChange(next: string) {
    setMake(next);
    setModel("");
    setYear("");
    setEstimateNote(null);
  }

  function onModelChange(next: string) {
    setModel(next);
    setYear("");
    setEstimateNote(null);
  }

  function onYearChange(next: string) {
    const y = next ? parseInt(next, 10) : "";
    setYear(y);
    if (!y || !model || !models[model]) return;

    const spec = models[model];
    const ev = spec.fuel === "electric";
    const estPrice = estimatedPriceForYear(spec.base, y, ev);
    setPrice(estPrice);
    setIsEV(ev);
    if (spec.cc) setEngine(engineSizeFromCc(spec.cc));

    const specLabel = ev ? `${spec.range} range` : spec.cc;
    const flag = ev
      ? " ⚡ EV — GREEN TAX EXEMPT"
      : spec.fuel === "hybrid"
        ? " 🌿 HYBRID"
        : "";
    setEstimateNote(
      `Estimated value for a ${y} ${make} ${model} (${specLabel} ${spec.type}): ${formatUsd(estPrice)}${flag}. You can adjust the price above.`,
    );
  }

  function calculate() {
    const numericPrice = typeof price === "number" ? price : parseFloat(String(price));
    if (!numericPrice || numericPrice < 500) {
      alert("Please select a vehicle or enter a valid price in USD");
      return;
    }
    setResult(
      calculateLandedCost({
        priceUsd: numericPrice,
        shippingUsd: shipping,
        condition,
        engineSize: engine,
        isEV,
        ngnRate,
      }),
    );
  }

  const benchmarkKey = make && model && year ? `${make}|${model}|${year}` : "";
  const marketPriceKobo = benchmarkKey ? marketPriceBenchmarks[benchmarkKey] : undefined;
  const vehicleLabel = make && model && year ? `${year} ${make} ${model}` : "this vehicle";

  async function submitLead() {
    if (phone.trim().length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setLeadStatus("submitting");
    try {
      const res = await fetch("/api/calculator/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          calculatorInputs: { region, make, model, year, price, condition, shipping, engine },
        }),
      });
      setLeadStatus(res.ok ? "sent" : "error");
    } catch {
      setLeadStatus("error");
    }
  }

  return (
    <div className="calc-card" id="calculator">
      <div className="calc-title">Vehicle Import Cost Calculator</div>
      <div className="calc-subtitle">
        Pick your dream car and see what it costs to land in Lagos — using the new July 2026
        rates.
      </div>

      <div className="calc-row">
        <div className="calc-field">
          <label htmlFor="calc-region">Import From</label>
          <select id="calc-region" value={region} onChange={(e) => onRegionChange(e.target.value)}>
            <option value="">Select source region</option>
            {(Object.keys(VEHICLE_CATALOG) as CatalogRegionName[]).map((r) => (
              <option key={r} value={r}>
                {r} {REGION_FLAGS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="calc-field">
          <label htmlFor="calc-fuel">Fuel Type</label>
          <select id="calc-fuel" value={fuel} onChange={(e) => onFuelChange(e.target.value)}>
            <option value="all">All Types</option>
            <option value="petrol">Petrol</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric (EV)</option>
          </select>
        </div>
      </div>

      {region && (
        <div className="calc-region-note show">
          📍 <strong>{region}:</strong> {VEHICLE_CATALOG[region].note}
        </div>
      )}

      <div className="calc-row three">
        <div className="calc-field">
          <label htmlFor="calc-make">Make</label>
          <select id="calc-make" value={make} onChange={(e) => onMakeChange(e.target.value)} disabled={!region}>
            <option value="">Select make</option>
            {Object.keys(makes).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="calc-field">
          <label htmlFor="calc-model">Model</label>
          <select id="calc-model" value={model} onChange={(e) => onModelChange(e.target.value)} disabled={!make}>
            <option value="">Select model</option>
            {Object.keys(models).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="calc-field">
          <label htmlFor="calc-year">Year</label>
          <select
            id="calc-year"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            disabled={!model}
          >
            <option value="">Select year</option>
            {Array.from({ length: 12 }, (_, i) => 2024 - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {estimateNote && <div className="calc-est-price show">💡 {estimateNote}</div>}

      <div className="calc-row">
        <div className="calc-field">
          <label htmlFor="calc-price">Vehicle Price (USD)</label>
          <input
            id="calc-price"
            type="number"
            placeholder="Auto-filled — editable"
            value={price}
            onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : "")}
          />
        </div>
        <div className="calc-field">
          <label htmlFor="calc-condition">Condition</label>
          <select id="calc-condition" value={condition} onChange={(e) => setCondition(e.target.value as VehicleCondition)}>
            <option value="used">Used (Tokunbo)</option>
            <option value="new">Brand New</option>
          </select>
        </div>
      </div>

      <div className="calc-row">
        <div className="calc-field">
          <label htmlFor="calc-shipping">Shipping Estimate (USD)</label>
          <input
            id="calc-shipping"
            type="number"
            value={shipping}
            onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="calc-field" style={{ opacity: isEV ? 0.5 : 1 }}>
          <label htmlFor="calc-engine">Engine Size</label>
          <select
            id="calc-engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value as EngineSize)}
            disabled={isEV}
          >
            <option value="small">Below 2,000cc</option>
            <option value="medium">2,000cc – 3,999cc</option>
            <option value="large">4,000cc+</option>
          </select>
        </div>
      </div>

      <button className="calc-btn" onClick={calculate}>
        Calculate Landed Cost
      </button>

      {result && (
        <div className="calc-result show" key={`${result.totalLandedKobo}-${result.dutyKobo}`}>
          {marketPriceKobo ? (
            <>
              <div className="calc-compare">
                <div className="calc-compare-card market">
                  <div className="compare-label">Lagos Dealer (Typical)</div>
                  <div className="compare-price">{formatNaira(marketPriceKobo)}</div>
                  <div className="compare-sub">Typical market price</div>
                </div>
                <div className="calc-compare-card dmech">
                  <div className="compare-label">DMECH Import</div>
                  <div className="compare-price">{formatNaira(result.totalLandedKobo)}</div>
                  <div className="compare-sub">Your total landed cost</div>
                </div>
              </div>
              <div className="calc-savings">
                <div
                  style={{
                    fontSize: 11,
                    color: "#6B8DA0",
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  You Save With DMECH
                </div>
                <span className="savings-amount">
                  {formatNaira(marketPriceKobo - result.totalLandedKobo)}
                </span>
                <span className="savings-pct">
                  {Math.round(((marketPriceKobo - result.totalLandedKobo) / marketPriceKobo) * 100)}%
                  less
                </span>
                <div className="savings-label">
                  on {vehicleLabel} vs a typical Lagos dealer — with full history &amp;
                  documentation
                </div>
              </div>
            </>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <div className="calc-result-title">Full Breakdown — DMECH Import</div>
            <div className="calc-result-total">{formatNaira(result.totalLandedKobo)}</div>
            <div className="calc-breakdown">
              <div className="line">
                <span className="line-label">Vehicle Price</span>
                <span className="line-value">
                  {formatUsd(typeof price === "number" ? price : 0)}
                </span>
              </div>
              <div className="line">
                <span className="line-label">Shipping</span>
                <span className="line-value">{formatUsd(shipping)}</span>
              </div>
              <div className="line">
                <span className="line-label">CIF Value</span>
                <span className="line-value">{formatNaira(result.cifKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">Import Duty ({result.dutyRatePct}%{isEV ? " — EV rate" : ""})</span>
                <span className="line-value">{formatNaira(result.dutyKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">Import Levy ({result.levyRatePct}%)</span>
                <span className="line-value">{formatNaira(result.levyKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">Surcharge (7%)</span>
                <span className="line-value">{formatNaira(result.surchargeKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">NAC Levy (2%)</span>
                <span className="line-value">{formatNaira(result.nacKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">CISS (1%)</span>
                <span className="line-value">{formatNaira(result.cissKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">ETLS (0.5%)</span>
                <span className="line-value">{formatNaira(result.etlsKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">Green Tax</span>
                {result.greenTaxExempt ? (
                  <span className="line-value" style={{ color: "#22C55E" }}>
                    EXEMPT {isEV ? "(Electric Vehicle)" : "(<2,000cc)"}
                  </span>
                ) : (
                  <span className="line-value">
                    {formatNaira(result.greenTaxKobo)} ({result.greenTaxRatePct}%)
                  </span>
                )}
              </div>
              <div className="line">
                <span className="line-label">VAT (7.5%)</span>
                <span className="line-value">{formatNaira(result.vatKobo)}</span>
              </div>
              <div className="line">
                <span className="line-label">Clearing &amp; Terminal</span>
                <span className="line-value">
                  {formatNaira(result.clearingKobo + result.terminalKobo)}
                </span>
              </div>
              <div className="line">
                <span className="line-label">DMECH Service Fee</span>
                <span className="line-value">{formatNaira(result.dmechFeeKobo)}</span>
              </div>
              <div
                className="line"
                style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 6, paddingTop: 8 }}
              >
                <span className="line-label" style={{ color: "#22C55E", fontWeight: 700 }}>
                  Instalment Option
                </span>
                <span className="line-value" style={{ color: "#22C55E" }}>
                  {formatNaira(result.totalLandedKobo * 0.4)} +{" "}
                  {formatNaira((result.totalLandedKobo * 0.6) / 6)}/mo × 6
                </span>
              </div>
            </div>
          </div>

          <div className="calc-disclaimer">
            ⚠️ <strong>This is an estimate.</strong> Final cost depends on the specific
            vehicle&apos;s condition, mileage, accident history, and the day&apos;s exchange
            rate (calculated at ₦{ngnRate}/$). Get an exact quote below and a DMECH rep will
            confirm the real auction price and total.
          </div>

          <div className="calc-lead">
            <input
              type="tel"
              aria-label="Phone number for exact quote"
              placeholder="Enter phone for exact quote"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={submitLead} disabled={leadStatus === "submitting"}>
              {leadStatus === "sent" ? "Sent ✓" : "Get Exact Quote"}
            </button>
          </div>
          {leadStatus === "sent" && (
            <div style={{ fontSize: 12, color: "#4ADE80", marginTop: 8 }}>
              Thank you! A DMECH representative will contact you within 2 hours with your exact
              personalised quote.
            </div>
          )}
          {leadStatus === "error" && (
            <div style={{ fontSize: 12, color: "#F87171", marginTop: 8 }}>
              Something went wrong — please try again or WhatsApp us directly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
