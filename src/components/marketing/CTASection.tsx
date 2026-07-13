import { MessageCircle, Phone } from "lucide-react";
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
          <MessageCircle size={16} strokeWidth={2} /> Chat on WhatsApp
        </a>
        <a className="cta-secondary" href={`tel:${CONTACT.phoneHref}`}>
          <Phone size={16} strokeWidth={2} /> Call: {CONTACT.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
