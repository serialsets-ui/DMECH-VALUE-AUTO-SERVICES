import type { Metadata } from "next";
import { CTASection } from "@/components/marketing/CTASection";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Contact Us — DMECH Value Auto Services",
  description: "Talk to DMECH on WhatsApp, by phone, or visit our hub in Lagos.",
};

const CONTACT_ITEMS = [
  { icon: "📍", label: "Visit Us", value: "Sangotedo, Ajah Axis, Lagos, Nigeria" },
  { icon: "📞", label: "Call", value: "0800-DMECH-00" },
  { icon: "💬", label: "WhatsApp", value: "0800 000 0000" },
  { icon: "🕒", label: "Hours", value: "Mon–Sat: 8am – 6pm" },
];

export default function ContactPage() {
  return (
    <div className="page-fade">
      <CTASection />
      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner">
          <div className="trust-grid contact-grid">
            {CONTACT_ITEMS.map((item, i) => (
              <Reveal key={item.label} delayMs={i * 80}>
                <div className="trust-card">
                  <div className="trust-icon">{item.icon}</div>
                  <div className="trust-title">{item.label}</div>
                  <div className="trust-desc">{item.value}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
