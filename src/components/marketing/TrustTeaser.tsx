import Link from "next/link";
import { Reveal } from "@/components/marketing/Reveal";

// Condensed Home-page version of Trust.tsx's "Why DMECH" section — same
// three documentation/history/pricing points, without the full dealer
// comparison table, plus a link to the full story on /about.
const ITEMS = [
  {
    icon: "📋",
    title: "Full Documentation",
    desc: "Original title, verified history report, pre-shipment inspection, and customs clearance papers on every vehicle.",
  },
  {
    icon: "🔎",
    title: "Verified Vehicle History",
    desc: "Accident records, mileage, and title status checked before purchase — no surprises after payment.",
  },
  {
    icon: "🎯",
    title: "Transparent Pricing",
    desc: "Every naira itemised — vehicle cost, shipping, duties, and our fee. The price we quote is the price you pay.",
  },
];

export function TrustTeaser() {
  return (
    <section className="section" style={{ background: "#fff" }} id="why">
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">Why DMECH</div>
          <div className="section-title">Buy With Confidence, Not Guesswork</div>
          <div className="section-subtitle">
            The informal car market runs on trust you can&apos;t verify. Here&apos;s how we&apos;re
            different.
          </div>
        </Reveal>
        <div className="trust-grid">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} delayMs={i * 80}>
              <div className="trust-card">
                <div className="trust-icon">{item.icon}</div>
                <div className="trust-title">{item.title}</div>
                <div className="trust-desc">{item.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/about" className="teaser-link" style={{ fontSize: 15 }}>
            See How DMECH Compares →
          </Link>
        </div>
      </div>
    </section>
  );
}
