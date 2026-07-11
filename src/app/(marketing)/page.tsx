import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Trust } from "@/components/marketing/Trust";
import { EVSpotlight } from "@/components/marketing/EVSpotlight";
import { VehicleMarketplace } from "@/components/marketing/VehicleMarketplace";
import { InstalmentPlans } from "@/components/marketing/InstalmentPlans";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { getPublicVehicles } from "@/lib/vehicles";
import { getConfigValue } from "@/lib/platform-config";

export const metadata: Metadata = {
  title: "DMECH Value Services — Import. Drive. Thrive.",
  description:
    "Import your vehicle from the USA, Europe, or China with transparent pricing and instalment plans, or buy a DMECH Certified Nigerian-used vehicle with a real warranty.",
};

export default async function MarketingHome() {
  const [vehicles, ngnRate, defaultDepositPct, defaultTenorMonths, marketPriceBenchmarks] =
    await Promise.all([
      getPublicVehicles(),
      getConfigValue("ngn_usd_rate", 1580),
      getConfigValue("default_deposit_pct", 40),
      getConfigValue("default_tenor_months", 6),
      getConfigValue<Record<string, number>>("market_price_benchmarks", {}),
    ]);

  return (
    <main>
      <Hero ngnRate={ngnRate} marketPriceBenchmarks={marketPriceBenchmarks} />
      <HowItWorks />
      <Trust />
      <EVSpotlight />
      <VehicleMarketplace
        vehicles={vehicles}
        defaultDepositPct={defaultDepositPct}
        defaultTenorMonths={defaultTenorMonths}
      />
      <InstalmentPlans />
      <Testimonials />
      <FAQ />
      <CTASection />
    </main>
  );
}
