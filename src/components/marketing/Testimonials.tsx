// Honesty gate: DMECH has no real customers yet, so this never shows
// fabricated named quotes as if real — same pattern as the certified
// program's "launching soon" empty state elsewhere on the site. Replace
// this whole file with real testimonial data once real customers exist.
export function Testimonials() {
  return (
    <section className="section" id="testimonials" style={{ background: "#fff" }}>
      <div className="section-inner center">
        <div className="section-eyebrow">Customer Stories</div>
        <div className="section-title">Real Stories, Coming Soon</div>
        <div className="section-subtitle">
          We&apos;re just getting started — this is where verified customer experiences will live.
        </div>
        <div className="vehicle-empty" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No reviews yet</div>
          <div style={{ fontSize: 14 }}>
            The first customers to import through DMECH will have their stories featured here.
            WhatsApp us if you&apos;d like to be among the first.
          </div>
        </div>
      </div>
    </section>
  );
}
