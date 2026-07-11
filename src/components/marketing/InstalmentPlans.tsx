export function InstalmentPlans() {
  return (
    <section className="section" id="instalment">
      <div className="section-inner">
        <div className="section-eyebrow">Flexible Financing</div>
        <div className="section-title">Two Ways to Pay</div>
        <div className="section-subtitle">
          Choose the plan that fits your budget. Both let you start paying while your vehicle is
          being shipped.
        </div>
        <div className="inst-grid">
          <div className="inst-card self">
            <div className="inst-badge">Quick Plan</div>
            <h3>DMECH Direct Finance</h3>
            <div className="inst-desc">
              Shorter term, higher deposit. DMECH funds the vehicle directly. Faster approval,
              simpler paperwork.
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Deposit</span>
              <span className="inst-detail-value">30% – 50%</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Repayment Period</span>
              <span className="inst-detail-value">3 – 9 months</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Admin Fee</span>
              <span className="inst-detail-value">10% – 15% flat</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Approval</span>
              <span className="inst-detail-value">24 – 48 hours</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Requirements</span>
              <span className="inst-detail-value">Valid ID, BVN, Guarantor</span>
            </div>
          </div>
          <div className="inst-card partner">
            <div className="inst-badge">Extended Plan</div>
            <h3>Partner Finance</h3>
            <div className="inst-desc">
              Longer term, lower deposit. Financed through our lending partners. More time to
              pay, competitive rates.
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Deposit</span>
              <span className="inst-detail-value">20% – 30%</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Repayment Period</span>
              <span className="inst-detail-value">6 – 24 months</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Interest</span>
              <span className="inst-detail-value">Market rate</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Approval</span>
              <span className="inst-detail-value">3 – 5 days</span>
            </div>
            <div className="inst-detail">
              <span className="inst-detail-label">Requirements</span>
              <span className="inst-detail-value">
                Employment letter, bank statement, BVN, Guarantor
              </span>
            </div>
          </div>
        </div>

        <div className="example-card" style={{ marginTop: 32 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            See How Pay-While-Shipping Works
          </div>
          <div style={{ fontSize: 14, color: "#8BADC0" }}>
            Example: A ₦18,500,000 Toyota Camry on a 6-month DMECH Direct plan with 40% deposit.
          </div>
          <div className="example-timeline">
            <div className="ex-step">
              <div className="ex-month">On Order</div>
              <div className="ex-amount">₦7.4M</div>
              <div className="ex-label">40% deposit — vehicle purchased &amp; shipped</div>
            </div>
            <div className="ex-step">
              <div className="ex-month">While Shipping</div>
              <div className="ex-amount">₦1.85M</div>
              <div className="ex-label">Months 1–2 paid while car is on the water</div>
            </div>
            <div className="ex-step">
              <div className="ex-month">On Arrival</div>
              <div className="ex-amount">₦1.85M</div>
              <div className="ex-label">Months 3–4 — vehicle cleared &amp; inspected</div>
            </div>
            <div className="ex-step">
              <div className="ex-month">Final</div>
              <div className="ex-amount">₦1.85M</div>
              <div className="ex-label">Months 5–6 — title transferred to you</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
