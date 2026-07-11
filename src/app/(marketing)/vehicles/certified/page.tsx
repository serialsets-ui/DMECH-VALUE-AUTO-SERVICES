import type { Metadata } from "next";
import Link from "next/link";
import { getPublicVehicles, isCertified } from "@/lib/vehicles";

export const metadata: Metadata = {
  title: "DMECH Certified Nigerian-Used — DMECH Value Auto Services",
  description:
    "Verified Nigerian-used vehicles, inspected and title-checked, sold with a real warranty backed by a dedicated reserve fund.",
};

const CERTIFIED_FAQS = [
  {
    q: "What does 'certified' actually mean?",
    a: "A vehicle only carries the DMECH Certified badge after it passes a title/provenance check (ownership history, liens, prior registration) and a full condition inspection. Vehicles that haven't completed this yet are clearly labeled and sold as-is, at a lower price — we never show the certified badge on a car that hasn't earned it.",
  },
  {
    q: "Who backs the warranty?",
    a: "DMECH does, directly. A fixed percentage of every certified sale is set aside into a dedicated warranty reserve fund — real money held against real claims, not just a promise printed on a listing.",
  },
  {
    q: "Where do these vehicles come from?",
    a: "A mix of outright purchases from the Nigerian market, consignment, and trade-ins. Seller identities are never disclosed — listings describe the vehicle's condition and history, not who owned it.",
  },
  {
    q: "What voids the warranty?",
    a: "Unauthorized third-party repairs, commercial or ride-hailing use unless specified, and accident damage after purchase are the standard exclusions. Full terms for each vehicle's specific coverage are shown on its listing before you buy.",
  },
];

export default async function CertifiedNigerianUsedPage() {
  const vehicles = await getPublicVehicles();
  const nigerianUsed = vehicles.filter((v) => v.source_region === "nigeria");
  const certifiedCount = nigerianUsed.filter(isCertified).length;

  return (
    <div className="page-fade">
      <section className="section" style={{ background: "#fff", paddingBottom: 0 }}>
        <div className="section-inner">
          <Link href="/vehicles" className="teaser-link" style={{ fontSize: 13 }}>
            ← All Vehicles
          </Link>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner center">
          <div className="section-eyebrow">Nigerian-Used, Verified</div>
          <div className="section-title">DMECH Certified Nigerian-Used</div>
          <div className="section-subtitle" style={{ margin: "0 auto" }}>
            Real Nigerian-used vehicles — inspected, title-checked, and sold with a warranty
            DMECH actually stands behind.
          </div>

          {nigerianUsed.length === 0 ? (
            <div className="vehicle-empty" style={{ maxWidth: 560, margin: "0 auto" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Certification program launching soon
              </div>
              <div style={{ fontSize: 14 }}>
                We&apos;re inspecting and title-verifying our first batch of Nigerian-used
                vehicles now. WhatsApp us to be notified the moment the first certified vehicles
                go live.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                gap: 24,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "18px 32px",
                marginTop: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "var(--green)" }}>
                  {certifiedCount}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Certified &amp; warrantied</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 700, color: "var(--blue)" }}>
                  {nigerianUsed.length}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Nigerian-used vehicles listed</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🔍</div>
              <div className="trust-title">Title &amp; Provenance Check</div>
              <div className="trust-desc">
                Ownership history, lien checks, and prior registration status are verified before
                a vehicle can be certified — the same discipline that protects our import
                pipeline, applied to vehicles we didn&apos;t import.
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🛠️</div>
              <div className="trust-title">Full Inspection</div>
              <div className="trust-desc">
                Every system is checked and documented before certification — the same condition
                report format you see on our imported vehicles.
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🛡️</div>
              <div className="trust-title">A Real Warranty</div>
              <div className="trust-desc">
                Backed by a dedicated reserve fund, not just a line in the ad copy. Coverage tier
                and duration are shown on every certified vehicle before you buy.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner">
          <div className="section-eyebrow">Certified Program FAQ</div>
          <div className="section-title">Common Questions</div>
          <div>
            {CERTIFIED_FAQS.map((item) => (
              <div className="faq-item open" key={item.q} style={{ marginBottom: 16 }}>
                <div className="faq-q" style={{ cursor: "default" }}>
                  {item.q}
                </div>
                <div className="faq-a" style={{ maxHeight: "none" }}>
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
