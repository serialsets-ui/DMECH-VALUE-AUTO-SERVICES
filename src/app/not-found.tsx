import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import "@/styles/dmech.css";
import "@/styles/marketing.css";

// Global 404 — rendered outside the (marketing) route group (no matching
// segment means no nested layout), so it can't rely on Nav/Footer and
// brings its own minimal branded shell instead, reusing the existing
// dark hero + CTA button styles rather than inventing new ones.
export const metadata: Metadata = {
  title: "Page Not Found — DMECH Value Auto Services",
};

export default function NotFound() {
  return (
    <div className="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="hero-inner" style={{ gridTemplateColumns: "1fr", textAlign: "center" }}>
        <div>
          <Link href="/" style={{ display: "inline-block", marginBottom: 32 }}>
            <Logo variant="splash" />
          </Link>
          <div className="hero-badge" style={{ margin: "0 auto 20px" }}>
            <span className="pulse" /> Page Not Found
          </div>
          <h1>This Page Took A Wrong Turn.</h1>
          <p style={{ margin: "0 auto 26px" }}>
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get
            you back on the road.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="cta-main">
              Back to Home
            </Link>
            <Link href="/vehicles" className="cta-secondary">
              Browse Vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
