import { toKobo } from "@/lib/money";

// Single source of truth for the July 2026 customs-duty formula. Ported from
// the marketing mockup's inline calculate() function — review flagged that
// the same math also needs to run for the Ops Customs module (duty_estimated
// / duty_paid on customs_entries), and having two independent copies of a
// customs-duty calculation is exactly the kind of thing that drifts out of
// sync. Both the marketing calculator and the Ops Customs module must import
// this instead of reimplementing the formula.

export type EngineSize = "small" | "medium" | "large"; // <2000cc | 2000-3999cc | 4000cc+
export type VehicleCondition = "used" | "new";

export interface DutyInput {
  priceUsd: number;
  shippingUsd: number;
  condition: VehicleCondition;
  engineSize: EngineSize;
  isEV: boolean;
  ngnRate: number; // naira per USD, from platform_config.ngn_usd_rate
}

export interface DutyBreakdown {
  cifUsd: number;
  cifKobo: number;
  dutyKobo: number;
  dutyRatePct: number;
  levyKobo: number;
  levyRatePct: number;
  surchargeKobo: number;
  nacKobo: number;
  cissKobo: number;
  etlsKobo: number;
  greenTaxKobo: number;
  greenTaxRatePct: number;
  greenTaxExempt: boolean;
  vatKobo: number;
  clearingKobo: number;
  terminalKobo: number;
  dmechFeeKobo: number;
  totalDutiesKobo: number;
  totalLandedKobo: number;
}

const CLEARING_FEE_NAIRA = 350_000;
const TERMINAL_FEE_NAIRA = 180_000;

export function calculateLandedCost(input: DutyInput): DutyBreakdown {
  const { priceUsd, shippingUsd, condition, engineSize, isEV, ngnRate } = input;

  const cifUsd = priceUsd + shippingUsd;
  const cifNaira = cifUsd * ngnRate;

  const dutyRatePct = isEV ? 10 : 20;
  const dutyNaira = cifNaira * (dutyRatePct / 100);

  const levyRatePct = condition === "used" ? 5 : 10;
  const levyNaira = cifNaira * (levyRatePct / 100);

  const surchargeNaira = dutyNaira * 0.07;
  const nacNaira = cifNaira * 0.02;
  const cissNaira = cifNaira * 0.01;
  const etlsNaira = cifNaira * 0.005;

  const greenTaxRatePct = isEV ? 0 : engineSize === "small" ? 0 : engineSize === "medium" ? 2 : 4;
  const greenTaxNaira = cifNaira * (greenTaxRatePct / 100);

  const subNaira = dutyNaira + levyNaira + surchargeNaira + nacNaira + cissNaira + etlsNaira + greenTaxNaira;
  const vatNaira = (cifNaira + subNaira) * 0.075;
  const totalDutiesNaira = subNaira + vatNaira;

  const dmechFeeNaira = cifNaira * 0.08;
  const totalLandedNaira =
    cifNaira + totalDutiesNaira + CLEARING_FEE_NAIRA + TERMINAL_FEE_NAIRA + dmechFeeNaira;

  return {
    cifUsd,
    cifKobo: toKobo(cifNaira),
    dutyKobo: toKobo(dutyNaira),
    dutyRatePct,
    levyKobo: toKobo(levyNaira),
    levyRatePct,
    surchargeKobo: toKobo(surchargeNaira),
    nacKobo: toKobo(nacNaira),
    cissKobo: toKobo(cissNaira),
    etlsKobo: toKobo(etlsNaira),
    greenTaxKobo: toKobo(greenTaxNaira),
    greenTaxRatePct,
    greenTaxExempt: greenTaxRatePct === 0,
    vatKobo: toKobo(vatNaira),
    clearingKobo: toKobo(CLEARING_FEE_NAIRA),
    terminalKobo: toKobo(TERMINAL_FEE_NAIRA),
    dmechFeeKobo: toKobo(dmechFeeNaira),
    totalDutiesKobo: toKobo(totalDutiesNaira),
    totalLandedKobo: toKobo(totalLandedNaira),
  };
}
