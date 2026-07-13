import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "FAQ — DMECH Value Auto Services",
  description: "Everything you need to know before you import or buy a certified vehicle.",
};

export default function FAQPage() {
  return (
    <div className="page-fade">
      <section className="section" style={{ background: "#fff", paddingBottom: 0 }}>
        <div className="section-inner center">
          <div className="section-eyebrow">Questions, Answered</div>
          <div className="section-title">Before You Import Or Buy</div>
          <div className="section-subtitle" style={{ margin: "0 auto" }}>
            Straight answers on EVs, financing, certification, and everything else customers ask
            us most.
          </div>
        </div>
      </section>
      <Reveal>
        <FAQ />
      </Reveal>
    </div>
  );
}
