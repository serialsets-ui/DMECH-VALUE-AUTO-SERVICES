import type { Metadata } from "next";
import Link from "next/link";
import { ServiceBookingForm } from "@/components/marketing/ServiceBookingForm";
import { Reveal } from "@/components/marketing/Reveal";
import { SERVICE_PAGES, WHAT_TO_EXPECT } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "Book a Service — DMECH Value Auto Services",
  description: "Book workshop service for your vehicle — diagnostics, repairs, and maintenance.",
};

export default function ServicePage() {
  return (
    <div className="page-fade">
      <section className="section photo-banner pb-workshop center">
        <div className="section-inner">
          <div className="section-eyebrow">Workshop</div>
          <div className="section-title">Book a Service</div>
          <div className="section-subtitle" style={{ margin: "0 auto" }}>
            Tell us what your vehicle needs — a DMECH workshop manager will confirm your booking
            on WhatsApp within 30 minutes.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <ServiceBookingForm />

          <div className="section-eyebrow" style={{ textAlign: "center", marginTop: 56 }}>
            What To Expect
          </div>
          <div className="section-title" style={{ textAlign: "center", fontSize: 26 }}>
            After You Book
          </div>
          <div className="trust-grid contact-grid" style={{ marginTop: 24 }}>
            {WHAT_TO_EXPECT.map((item, i) => (
              <Reveal key={item.title} delayMs={i * 80}>
                <div className="trust-card">
                  <div className="trust-icon">{item.icon}</div>
                  <div className="trust-title">{item.title}</div>
                  <div className="trust-desc">{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="section-eyebrow" style={{ textAlign: "center", marginTop: 56 }}>
            Browse By Service
          </div>
          <div className="section-title" style={{ textAlign: "center", fontSize: 26 }}>
            What Do You Need Done?
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 24,
            }}
          >
            {SERVICE_PAGES.map((s, i) => (
              <Reveal key={s.slug} delayMs={i * 50}>
                <Link
                  href={`/service/${s.slug}`}
                  className="teaser-card"
                  style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                    {s.name}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
