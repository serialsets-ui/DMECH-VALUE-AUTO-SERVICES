import type { Metadata } from "next";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Trust } from "@/components/marketing/Trust";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "About Us — DMECH Value Auto Services",
  description:
    "How DMECH's import and certification process works, why it's different from the informal car market, and what customers say.",
};

export default function AboutPage() {
  return (
    <div className="page-fade">
      <section className="section photo-banner pb-cargo center">
        <div className="section-inner">
          <div className="section-eyebrow">About DMECH</div>
          <div className="section-title">Built To Fix The Informal Car Market</div>
          <div className="section-subtitle" style={{ margin: "0 auto" }}>
            From sourcing to delivery, every step is designed to replace guesswork with verified
            documentation — here&apos;s exactly how it works, and why it&apos;s different.
          </div>
        </div>
      </section>
      <HowItWorks />
      <Trust />
      <Reveal>
        <Testimonials />
      </Reveal>
    </div>
  );
}
