import Link from "next/link";
import { isCertified, type PublicVehicle } from "@/lib/vehicle-display";
import { Reveal } from "@/components/marketing/Reveal";
import { AnimatedCounter } from "@/components/marketing/AnimatedCounter";

export function CertifiedTeaser({ vehicles }: { vehicles: PublicVehicle[] }) {
  const nigerianUsed = vehicles.filter((v) => v.source_region === "nigeria");
  const certifiedCount = nigerianUsed.filter(isCertified).length;

  return (
    <section
      className="section"
      style={{ background: "linear-gradient(135deg,#0F1923,#0A2818)", position: "relative" }}
    >
      <div className="section-inner">
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 32, alignItems: "center" }}>
            <div>
              <div className="section-eyebrow" style={{ color: "#4ADE80" }}>
                Nigerian-Used, Verified
              </div>
              <div className="section-title" style={{ color: "#fff" }}>
                DMECH Certified Nigerian-Used
              </div>
              <p style={{ color: "#8BADC0", fontSize: 15, lineHeight: 1.7, maxWidth: 480, marginBottom: 20 }}>
                Vehicles already in Nigeria — inspected, title-checked, and sold with a real
                warranty backed by a dedicated reserve fund. Not every listing is certified yet;
                the ones that are, are clearly labeled.
              </p>
              <Link
                href="/vehicles/certified"
                className="teaser-link"
                style={{ fontSize: 15, color: "#4ADE80" }}
              >
                Learn More →
              </Link>
            </div>
            {certifiedCount > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(34,197,94,.2)",
                  borderRadius: 14,
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <AnimatedCounter
                  value={certifiedCount}
                  className="hero-stat-value"
                  style={{ fontSize: 36, color: "#4ADE80" }}
                />
                <div style={{ fontSize: 12, color: "#8BADC0", marginTop: 4 }}>
                  Certified &amp; warrantied vehicles
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
