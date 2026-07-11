import Link from "next/link";

export function EVSpotlight() {
  return (
    <section
      className="section"
      id="ev"
      style={{
        background: "linear-gradient(135deg,#0F1923,#0A2818)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 700px 400px at 75% 40%,rgba(34,197,94,.10),transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div className="section-inner" style={{ position: "relative" }}>
        <div className="section-eyebrow" style={{ color: "#4ADE80" }}>
          ⚡ Electric Vehicles
        </div>
        <div className="section-title" style={{ color: "#fff" }}>
          Go Electric, Pay Less Tax
        </div>
        <div className="section-subtitle" style={{ color: "#8BADC0" }}>
          EVs are the smartest import play in Nigeria right now. Lower duties, Green Tax
          exemption, and no fuel queues. DMECH sources them from the USA and China — and
          services them too.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
            marginBottom: 32,
          }}
          className="ev-benefits"
        >
          {[
            {
              icon: "🍃",
              title: "Green Tax Exempt",
              body: "Every EV is 100% exempt from the Green Tax Surcharge, and attracts a reduced 10% import duty instead of 20%. The savings are real and immediate.",
            },
            {
              icon: "💸",
              title: "No Fuel, Lower Running Cost",
              body: "Skip the fuel queues and the pump price. Charge at home or at work. For high-mileage drivers, the running-cost savings add up fast.",
            },
            {
              icon: "🔧",
              title: "We Service What We Sell",
              body: "EV support in Nigeria is thin — so DMECH built it in. Our hub services and maintains the EVs we import, so you're never stranded.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(34,197,94,.2)",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div style={{ fontSize: 14, color: "#8BADC0", lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "rgba(245,158,11,.08)",
            border: "1px solid rgba(245,158,11,.2)",
            borderRadius: 12,
            padding: "18px 22px",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
          <div style={{ fontSize: 13, color: "#C0D0E0", lineHeight: 1.6 }}>
            <strong style={{ color: "#F5A623" }}>Straight talk on charging:</strong> Public
            charging in Nigeria is still limited, so EVs work best if you can charge at home or
            at your office. We&apos;ll help you assess whether an EV fits your daily routine
            before you commit — and we advise on home charging setup. If an EV isn&apos;t right
            for you yet, we&apos;ll tell you honestly and recommend a hybrid or efficient petrol
            option instead.
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link
            href="/vehicles?filter=ev"
            className="calc-btn"
            style={{ maxWidth: 280, margin: "0 auto", background: "#22C55E", display: "block" }}
          >
            Browse EV Inventory ⚡
          </Link>
        </div>
      </div>
    </section>
  );
}
