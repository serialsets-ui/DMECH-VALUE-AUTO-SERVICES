import type { Metadata } from "next";
import { ServiceBookingForm } from "@/components/marketing/ServiceBookingForm";

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
      </div>
    </section>
  );
}
