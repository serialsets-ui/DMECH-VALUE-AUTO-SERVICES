const TICKER_ITEMS = [
  { text: "⚡ New: Certified Nigerian-used vehicles now available", orange: false },
  { text: "3 Vehicles Cleared Customs This Week", orange: true },
  { text: "🇨🇳 Now Importing from China — New Cars & EVs", orange: false },
  { text: "Import Duties Reduced — Save More in 2026", orange: true },
  { text: "⚡ EVs: 10% Duty, Zero Green Tax — Ask Us How", orange: false },
  { text: "Chery Tiggo 7 Pro 2024 — Brand New In Stock", orange: true },
  { text: "Financing Available — Pay While Shipping", orange: false },
  { text: "DMECH Certified — Verified History, Real Warranty", orange: true },
];

export function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicated for seamless loop
  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span className="ticker-item" key={i}>
            <span className={`ticker-dot ${item.orange ? "orange" : ""}`} />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
