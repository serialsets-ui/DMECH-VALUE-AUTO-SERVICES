import type { Metadata } from "next";
import Link from "next/link";
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
      <section className="section photo-banner pb-transport center">
        <div className="section-inner">
          <div className="section-eyebrow">Own It Sooner</div>
          <div className="section-title">Start Paying While It Ships</div>
          <div className="section-subtitle" style={{ margin: "0 auto" }}>
            DMECH Direct Finance and Partner Finance both let your instalments begin the moment
            your vehicle is purchased — not after it clears customs.
          </div>
          <Link href="/register" className="nav-cta" style={{ display: "inline-flex", marginTop: 20, textDecoration: "none" }}>
            Apply for Financing →
          </Link>
        </div>
      </section>
      <Reveal>
        <InstalmentPlans />
      </Reveal>
    </div>
  );
}
