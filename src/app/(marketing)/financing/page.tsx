import type { Metadata } from "next";
import { InstalmentPlans } from "@/components/marketing/InstalmentPlans";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Financing & Instalment Plans — DMECH Value Auto Services",
  description:
    "DMECH Direct Finance and Partner Finance — pay while your vehicle ships, with flexible deposit and tenor options.",
};

export default function FinancingPage() {
  return (
    <div className="page-fade">
      <Reveal>
        <InstalmentPlans />
      </Reveal>
    </div>
  );
}
