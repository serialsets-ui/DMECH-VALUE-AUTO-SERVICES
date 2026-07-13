import type { Metadata } from "next";
import { ServiceBookingForm } from "@/components/marketing/ServiceBookingForm";

export const metadata: Metadata = {
  title: "Book a Service — DMECH Value Auto Services",
  description: "Book workshop service for your vehicle — diagnostics, repairs, and maintenance.",
};

const WHAT_TO_EXPECT = [
  {
    icon: "📞",
    title: "Confirmation within 30 minutes",
    desc: "We'll call or WhatsApp to confirm your booking and give you a time slot.",
  },
  {
    icon: "🧾",
    title: "A clear quote before work starts",
    desc: "No work begins until you've agreed a price — no surprise charges at pickup.",
  },
  {
    icon: "🔧",
    title: "Updates while it's in the workshop",
    desc: "You'll hear from us if anything changes once the job is underway, not just when it's done.",
  },
  {
    icon: "🚗",
    title: "Your vehicle back on schedule",
    desc: "We tell you when to expect it and stick to it.",
  },
];

export default function ServicePage() {
  return (
    <section className="section page-fade">
      <div className="section-inner">
        <div className="section-eyebrow" style={{ textAlign: "center" }}>
          Workshop
        </div>
        <div className="section-title" style={{ textAlign: "center" }}>
          Book a Service
        </div>
        <div className="section-subtitle" style={{ textAlign: "center", margin: "0 auto 36px" }}>
          Tell us what your vehicle needs — a DMECH workshop manager will confirm your booking on
          WhatsApp within 30 minutes.
        </div>
        <ServiceBookingForm />

        <div className="section-eyebrow" style={{ textAlign: "center", marginTop: 56 }}>
          What To Expect
        </div>
        <div className="section-title" style={{ textAlign: "center", fontSize: 26 }}>
          After You Book
        </div>
        <div className="trust-grid contact-grid" style={{ marginTop: 24 }}>
          {WHAT_TO_EXPECT.map((item) => (
            <div className="trust-card" key={item.title}>
              <div className="trust-icon">{item.icon}</div>
              <div className="trust-title">{item.title}</div>
              <div className="trust-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
