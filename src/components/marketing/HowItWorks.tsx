import { Search, Wallet, Ship, Car } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const STEPS = [
  {
    icon: Search,
    title: "Choose Your Vehicle",
    desc: "Browse landed stock or tell us exactly what you want. We source from verified dealers and auctions in the USA and Europe.",
  },
  {
    icon: Wallet,
    title: "Pay Your Way",
    desc: "Pay in full or choose an instalment plan. Start paying while your vehicle ships — by the time it arrives, you're already ahead.",
  },
  {
    icon: Ship,
    title: "Track It Live",
    desc: "Follow your vehicle from port of origin to Lagos. Real-time updates via our portal and WhatsApp. No surprises.",
  },
  {
    icon: Car,
    title: "Drive Home",
    desc: "We clear customs, inspect the vehicle, and prepare all documentation. Pick up from our hub or get it delivered.",
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how" style={{ background: "#fff" }}>
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">How It Works</div>
          <div className="section-title">From Auction to Your Driveway</div>
          <div className="section-subtitle">
            We handle the entire process. You choose the car, we handle the rest.
          </div>
        </Reveal>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 80}>
              <div className="step-card">
                <div className="step-num">{i + 1}</div>
                <div className="step-icon">
                  <step.icon size={32} strokeWidth={1.75} />
                </div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
