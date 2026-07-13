import { CONTACT, whatsappHref } from "@/lib/contact";

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
          href={whatsappHref("Hi DMECH, I want to import a vehicle")}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Chat on WhatsApp
        </a>
        <a className="cta-secondary" href={`tel:${CONTACT.phoneHref}`}>
          📞 Call: {CONTACT.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
