import type { Metadata } from "next";
import { VehicleMarketplace } from "@/components/marketing/VehicleMarketplace";
import { getPublicVehicles } from "@/lib/vehicles";
import { getConfigValue } from "@/lib/platform-config";

export const metadata: Metadata = {
  title: "Vehicle Marketplace — DMECH Value Auto Services",
  description:
    "Browse verified vehicles available now, in transit, and at port — imports and DMECH Certified Nigerian-used.",
};

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const [vehicles, defaultDepositPct, defaultTenorMonths] = await Promise.all([
    getPublicVehicles(),
    getConfigValue("default_deposit_pct", 40),
    getConfigValue("default_tenor_months", 6),
  ]);

  return (
    <div className="page-fade">
      <VehicleMarketplace
        vehicles={vehicles}
        defaultDepositPct={defaultDepositPct}
        defaultTenorMonths={defaultTenorMonths}
        initialFilterKey={filter}
      />
    </div>
  );
}
