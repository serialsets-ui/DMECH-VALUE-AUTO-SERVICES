import { FileText, Search, Target, TriangleAlert, CircleCheck, X, Check } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

export function Trust() {
  return (
    <section className="section" id="why">
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">Why DMECH</div>
          <div className="section-title">Buy With Confidence, Not Guesswork</div>
          <div className="section-subtitle">
            The informal car market runs on trust you can&apos;t verify. We built DMECH to change
            that.
          </div>
        </Reveal>
        <div className="trust-grid">
          <Reveal delayMs={0}>
            <div className="trust-card">
              <div className="trust-icon">
                <FileText size={24} strokeWidth={1.75} />
              </div>
              <div className="trust-title">Full Documentation</div>
              <div className="trust-desc">
                Every vehicle comes with original title, verified history report, pre-shipment
                inspection, and customs clearance papers. Nothing hidden.
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="trust-card">
              <div className="trust-icon">
                <Search size={24} strokeWidth={1.75} />
              </div>
              <div className="trust-title">Verified Vehicle History</div>
              <div className="trust-desc">
                We check accident records, mileage, and title status before purchase. You know
                exactly what you&apos;re buying — no surprises after payment.
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={160}>
            <div className="trust-card">
              <div className="trust-icon">
                <Target size={24} strokeWidth={1.75} />
              </div>
              <div className="trust-title">Transparent Pricing</div>
              <div className="trust-desc">
                Our calculator shows every naira — vehicle cost, shipping, duties, and our fee. The
                price we quote is the price you pay.
              </div>
            </div>
          </Reveal>
        </div>
        <div className="vs-row">
          <div className="vs-card them">
            <div className="vs-head">
              <TriangleAlert size={18} strokeWidth={2} /> Typical Roadside Dealer
            </div>
            <div className="vs-item">
              <span className="ic">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>Hidden markups and inflated &quot;clearing fees&quot;</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>No vehicle history — you gamble on accidents &amp; mileage</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>Full cash upfront, no financing options</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>No accountability after money changes hands</span>
            </div>
          </div>
          <div className="vs-card us">
            <div className="vs-head">
              <CircleCheck size={18} strokeWidth={2} /> The DMECH Way
            </div>
            <div className="vs-item">
              <span className="ic">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Every cost itemised before you commit</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Verified history report on every vehicle</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Flexible instalments — pay while it ships</span>
            </div>
            <div className="vs-item">
              <span className="ic">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Ongoing service &amp; support at our hub</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
