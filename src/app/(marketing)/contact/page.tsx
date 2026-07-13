import type { Metadata } from "next";
import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { CTASection } from "@/components/marketing/CTASection";
import { Reveal } from "@/components/marketing/Reveal";
import { CONTACT, ADDRESS_FULL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us — DMECH Value Auto Services",
  description: "Talk to DMECH on WhatsApp, by phone, or visit our hub in Lagos.",
};

const CONTACT_ITEMS = [
  { icon: MapPin, label: "Visit Us", value: ADDRESS_FULL },
  { icon: Phone, label: "Call", value: CONTACT.phoneDisplay },
  { icon: MessageCircle, label: "WhatsApp", value: CONTACT.whatsappDisplay },
  { icon: Clock, label: "Hours", value: CONTACT.hours },
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
                  <div className="trust-icon">
                    <item.icon size={24} strokeWidth={1.75} />
                  </div>
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
