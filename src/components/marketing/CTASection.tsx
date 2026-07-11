export function CTASection() {
  return (
    <section className="cta-section" id="contact">
      <h2>Ready to Import Your Next Vehicle?</h2>
      <p>
        Talk to us today. Whether you know exactly what you want or need guidance, we&apos;ll
        walk you through every step.
      </p>
      <div className="cta-buttons">
        <a
          className="cta-main cta-wa"
          href="https://wa.me/2348000000000?text=Hi%20DMECH%2C%20I%20want%20to%20import%20a%20vehicle"
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Chat on WhatsApp
        </a>
        <a className="cta-secondary" href="tel:08000000000">
          📞 Call: 0800-DMECH-00
        </a>
      </div>
    </section>
  );
}
