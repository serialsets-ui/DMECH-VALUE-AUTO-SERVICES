import type { FuelType } from "@/types";

// Reference catalog used only to auto-fill the calculator's price/spec
// fields — ported as-is from the marketing mockup's RDB object (55+ models
// across 3 regions). This is estimation data, not real inventory; it has
// nothing to do with the `vehicles` table. A future pass could move this
// into an admin-editable store (mirroring market_price_benchmarks), but for
// Phase 1 this is a straight port, not a redesign.

export interface CatalogModel {
  base: number; // typical USD price for a 2024-year unit
  cc?: string; // engine size label, e.g. "2500cc" — absent for EVs
  range?: string; // e.g. "430 km" — EVs only
  type: string; // body type label shown to the user, e.g. "Sedan EV"
  fuel: FuelType;
}

export interface CatalogRegion {
  shipping: number; // typical USD shipping estimate
  note: string;
  makes: Record<string, Record<string, CatalogModel>>;
}

export type CatalogRegionName = "USA" | "Europe" | "China";

export const VEHICLE_CATALOG: Record<CatalogRegionName, CatalogRegion> = {
  USA: {
    shipping: 1500,
    note: "Auction-sourced (Copart, IAAI). Mostly used. 6–8 weeks shipping.",
    makes: {
      Toyota: {
        Camry: { base: 15500, cc: "2500cc", type: "Sedan", fuel: "petrol" },
        Corolla: { base: 13000, cc: "1800cc", type: "Sedan", fuel: "petrol" },
        RAV4: { base: 18000, cc: "2000cc", type: "SUV", fuel: "petrol" },
        Highlander: { base: 24000, cc: "3500cc", type: "SUV", fuel: "petrol" },
        "Camry Hybrid": { base: 18500, cc: "2500cc", type: "Sedan", fuel: "hybrid" },
      },
      Honda: {
        Accord: { base: 14500, cc: "1500cc", type: "Sedan", fuel: "petrol" },
        Civic: { base: 12500, cc: "1500cc", type: "Sedan", fuel: "petrol" },
        "CR-V": { base: 16000, cc: "1500cc", type: "SUV", fuel: "petrol" },
        Pilot: { base: 21000, cc: "3500cc", type: "SUV", fuel: "petrol" },
      },
      Lexus: {
        "RX 350": { base: 26000, cc: "3500cc", type: "SUV", fuel: "petrol" },
        "ES 350": { base: 22000, cc: "3500cc", type: "Sedan", fuel: "petrol" },
        "GX 460": { base: 32000, cc: "4600cc", type: "SUV", fuel: "petrol" },
      },
      "Mercedes-Benz": {
        "C-Class": { base: 22000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        "E-Class": { base: 28000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        GLE: { base: 38000, cc: "3000cc", type: "SUV", fuel: "petrol" },
      },
      Tesla: {
        "Model 3": { base: 32000, range: "430 km", type: "Sedan EV", fuel: "electric" },
        "Model Y": { base: 38000, range: "450 km", type: "SUV EV", fuel: "electric" },
      },
      Ford: {
        Explorer: { base: 20000, cc: "3500cc", type: "SUV", fuel: "petrol" },
        Edge: { base: 17000, cc: "2000cc", type: "SUV", fuel: "petrol" },
      },
    },
  },
  Europe: {
    shipping: 1300,
    note: "Dealer-sourced (UK, Germany, Belgium). Clean-title used. 4–6 weeks shipping.",
    makes: {
      Toyota: {
        Corolla: { base: 13500, cc: "1800cc", type: "Sedan", fuel: "petrol" },
        RAV4: { base: 18500, cc: "2000cc", type: "SUV", fuel: "petrol" },
        "C-HR": { base: 16000, cc: "1800cc", type: "SUV", fuel: "hybrid" },
      },
      "Mercedes-Benz": {
        "C-Class": { base: 23000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        "E-Class": { base: 29000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        GLC: { base: 31000, cc: "2000cc", type: "SUV", fuel: "petrol" },
      },
      BMW: {
        "3 Series": { base: 24000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        "5 Series": { base: 30000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        X5: { base: 40000, cc: "3000cc", type: "SUV", fuel: "petrol" },
      },
      Volkswagen: {
        Golf: { base: 14000, cc: "1400cc", type: "Hatchback", fuel: "petrol" },
        Tiguan: { base: 19000, cc: "2000cc", type: "SUV", fuel: "petrol" },
        "ID.4": { base: 30000, range: "520 km", type: "SUV EV", fuel: "electric" },
      },
      Audi: {
        A4: { base: 23000, cc: "2000cc", type: "Sedan", fuel: "petrol" },
        Q5: { base: 33000, cc: "2000cc", type: "SUV", fuel: "petrol" },
      },
    },
  },
  China: {
    shipping: 1800,
    note: "Factory/dealer-sourced. New & used available. EV specialists. 5–8 weeks shipping.",
    makes: {
      BYD: {
        "Dolphin (EV)": { base: 16000, range: "420 km", type: "Hatchback EV", fuel: "electric" },
        "Atto 3 (EV)": { base: 22000, range: "480 km", type: "SUV EV", fuel: "electric" },
        "Seal (EV)": { base: 28000, range: "570 km", type: "Sedan EV", fuel: "electric" },
        "Song Plus (Hybrid)": { base: 24000, cc: "1500cc", type: "SUV", fuel: "hybrid" },
      },
      Chery: {
        "Tiggo 4": { base: 13000, cc: "1500cc", type: "SUV", fuel: "petrol" },
        "Tiggo 7 Pro": { base: 17000, cc: "1600cc", type: "SUV", fuel: "petrol" },
        "Tiggo 8": { base: 21000, cc: "2000cc", type: "SUV", fuel: "petrol" },
        "Arrizo 5": { base: 11000, cc: "1500cc", type: "Sedan", fuel: "petrol" },
      },
      GAC: {
        GS3: { base: 14000, cc: "1500cc", type: "SUV", fuel: "petrol" },
        GS4: { base: 18000, cc: "2000cc", type: "SUV", fuel: "petrol" },
        "Aion Y (EV)": { base: 20000, range: "500 km", type: "SUV EV", fuel: "electric" },
        Empow: { base: 16000, cc: "1500cc", type: "Sedan", fuel: "petrol" },
      },
      Changan: {
        "CS35 Plus": { base: 13500, cc: "1600cc", type: "SUV", fuel: "petrol" },
        "CS55 Plus": { base: 17000, cc: "1500cc", type: "SUV", fuel: "petrol" },
        Eado: { base: 12000, cc: "1600cc", type: "Sedan", fuel: "petrol" },
      },
      MG: {
        MG5: { base: 14000, cc: "1500cc", type: "Sedan", fuel: "petrol" },
        ZS: { base: 15500, cc: "1500cc", type: "SUV", fuel: "petrol" },
        "MG4 (EV)": { base: 21000, range: "450 km", type: "Hatchback EV", fuel: "electric" },
        "ZS EV": { base: 23000, range: "440 km", type: "SUV EV", fuel: "electric" },
      },
      Geely: {
        Coolray: { base: 15000, cc: "1500cc", type: "SUV", fuel: "petrol" },
        Emgrand: { base: 12500, cc: "1500cc", type: "Sedan", fuel: "petrol" },
        Azkarra: { base: 19000, cc: "1800cc", type: "SUV", fuel: "petrol" },
      },
    },
  },
};

export function catalogMakes(region: CatalogRegionName, fuel: FuelType | "all") {
  const makes = VEHICLE_CATALOG[region].makes;
  if (fuel === "all") return makes;
  const filtered: typeof makes = {};
  for (const [make, models] of Object.entries(makes)) {
    const matching = Object.fromEntries(
      Object.entries(models).filter(([, spec]) => spec.fuel === fuel),
    );
    if (Object.keys(matching).length) filtered[make] = matching;
  }
  return filtered;
}

export function estimatedPriceForYear(base: number, year: number, isEV: boolean): number {
  const yearsBack = 2024 - year;
  const depreciationRate = isEV ? 0.94 : 0.92;
  return Math.round((base * Math.pow(depreciationRate, yearsBack)) / 100) * 100;
}

export function engineSizeFromCc(cc: string | undefined): "small" | "medium" | "large" {
  if (!cc) return "small";
  const value = parseInt(cc, 10);
  return value < 2000 ? "small" : value < 4000 ? "medium" : "large";
}
