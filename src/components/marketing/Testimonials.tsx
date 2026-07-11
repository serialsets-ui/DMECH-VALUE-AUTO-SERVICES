// Specimen data — spec explicitly flags these as placeholders. Swap for real
// customer testimonials before launch (Phase 5 item).
const TESTIMONIALS = [
  {
    text: "I was scared of being scammed importing a car. DMECH showed me every cost upfront and I paid in instalments while my Camry was still shipping. Zero surprises.",
    initials: "AK",
    name: "Adebayo Kunle",
    role: "Lagos · Toyota Camry 2020",
  },
  {
    text: "The tracking gave me peace of mind — I could see my RAV4 crossing the Atlantic. When it landed, the papers were complete. This is how it should be done.",
    initials: "FA",
    name: "Folake Adeyinka",
    role: "Lekki · Toyota RAV4 2021",
  },
  {
    text: "As a business, we needed fleet vehicles without tying up all our cash. The partner finance plan let us spread payments. Professional from start to finish.",
    initials: "ZL",
    name: "Zenith Logistics",
    role: "Corporate · Fleet of 5",
  },
];

export function Testimonials() {
  return (
    <section className="section" id="testimonials" style={{ background: "#fff" }}>
      <div className="section-inner center">
        <div className="section-eyebrow">Customer Stories</div>
        <div className="section-title">Trusted by Nigerians Like You</div>
        <div className="section-subtitle">Real customers who imported through DMECH.</div>
        <div className="testi-grid" style={{ textAlign: "left" }}>
          {TESTIMONIALS.map((t) => (
            <div className="testi-card" key={t.name}>
              <div className="testi-stars">★★★★★</div>
              <div className="testi-text">&quot;{t.text}&quot;</div>
              <div className="testi-author">
                <div className="testi-avatar">{t.initials}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
