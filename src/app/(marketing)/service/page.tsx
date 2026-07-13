import type { Metadata } from "next";
import Link from "next/link";
import { ServiceBookingForm } from "@/components/marketing/ServiceBookingForm";
import { SERVICE_PAGES, WHAT_TO_EXPECT } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "Book a Service — DMECH Value Auto Services",
  description: "Book workshop service for your vehicle — diagnostics, repairs, and maintenance.",
};

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
          {SERVICE_PAGES.map((s) => (
            <Link
              key={s.slug}
              href={`/service/${s.slug}`}
              className="teaser-card"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{s.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
