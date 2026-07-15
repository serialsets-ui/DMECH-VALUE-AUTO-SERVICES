import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";

export function FinancingTeaser() {
  return (
    <section className="section">
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">Flexible Financing</div>
          <div className="section-title">Two Ways to Pay</div>
          <div className="section-subtitle">
            Both let you start paying while your vehicle is being shipped.
          </div>
        </Reveal>
        <div className="inst-grid">
          <Reveal>
            <div className="inst-card self">
              <div className="inst-badge">Quick Plan</div>
              <h3>DMECH Direct Finance</h3>
              <div className="inst-desc">
                30–50% deposit, 3–9 months, 24–48 hour approval. Simpler paperwork, faster start.
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={100}>
            <div className="inst-card partner">
              <div className="inst-badge">Extended Plan</div>
              <h3>Partner Finance — Autochek</h3>
              <div className="inst-desc">
                20–30% deposit, 6–24 months, competitive rates through Autochek — DMECH is a
                registered dealer partner.
              </div>
            </div>
          </Reveal>
        </div>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/financing" className="teaser-link" style={{ fontSize: 15 }}>
            See Full Financing Details →
          </Link>
        </div>
      </div>
    </section>
  );
}
