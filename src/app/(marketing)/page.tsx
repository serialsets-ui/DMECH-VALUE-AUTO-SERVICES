import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { VehicleTeaser } from "@/components/marketing/VehicleTeaser";
import { CertifiedTeaser } from "@/components/marketing/CertifiedTeaser";
import { TrustTeaser } from "@/components/marketing/TrustTeaser";
import { EVSpotlight } from "@/components/marketing/EVSpotlight";
import { Reveal } from "@/components/marketing/Reveal";
import { FinancingTeaser } from "@/components/marketing/FinancingTeaser";
import { CTASection } from "@/components/marketing/CTASection";
import { getPublicVehicles } from "@/lib/vehicles";
import { getConfigValue } from "@/lib/platform-config";

export const metadata: Metadata = {
  title: "DMECH Value Auto Services — Import. Drive. Thrive.",
  description:
    "Import your vehicle from the USA, Europe, or China with transparent pricing and instalment plans, or buy a DMECH Certified Nigerian-used vehicle with a real warranty.",
};

export default async function MarketingHome() {
  const [vehicles, ngnRate, marketPriceBenchmarks] = await Promise.all([
    getPublicVehicles(),
    getConfigValue("ngn_usd_rate", 1580),
    getConfigValue<Record<string, number>>("market_price_benchmarks", {}),
  ]);

  return (
    <main className="page-fade">
      <Hero ngnRate={ngnRate} marketPriceBenchmarks={marketPriceBenchmarks} />
      <VehicleTeaser vehicles={vehicles} />
      <CertifiedTeaser vehicles={vehicles} />
      <TrustTeaser />
      <Reveal>
        <EVSpotlight />
      </Reveal>
      <FinancingTeaser />
      <CTASection />
    </main>
  );
}
