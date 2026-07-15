"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do you import electric vehicles (EVs)?",
    a: "Yes — EVs are one of our specialities. We source them from the USA (Tesla) and China (BYD, GAC, MG, and others). EVs attract a lower 10% import duty and are fully exempt from the Green Tax, so they often land cheaper than an equivalent petrol car. And because EV support in Nigeria is limited, we service and maintain the EVs we sell.",
  },
  {
    q: "Can I charge an EV in Nigeria?",
    a: "Realistically, EVs work best right now if you can charge at home or at your workplace, since public charging is still limited. We'll help you assess whether an EV fits your daily routine before you buy, and advise on home charging setup. If an EV isn't right for you yet, we'll honestly recommend a hybrid or efficient petrol option instead.",
  },
  {
    q: "What's the DMECH Certified Nigerian-Used program?",
    a: "Alongside imports, DMECH sources verified used vehicles already in Nigeria — bought outright, taken on consignment, or accepted as trade-ins. Every vehicle we certify passes a title/provenance check and a full inspection before it carries our warranty. Vehicles that haven't completed certification yet are clearly labeled and sold as-is at a lower price — we never dress up an uncertified car as certified.",
  },
  {
    q: "What does the DMECH warranty actually cover?",
    a: "Certified vehicles carry a real warranty backed by a dedicated reserve fund DMECH sets aside from every certified sale — not just a marketing promise. Coverage tier, duration, and covered components are shown on each certified vehicle's listing. Full terms and the claims process are on our Certified program page.",
  },
  {
    q: "What's the advantage of importing from China?",
    a: "China offers brand-new vehicles — especially EVs and modern SUVs from BYD, Chery, GAC, MG, Changan, and Geely — at prices well below equivalent US or European cars. If you want a new vehicle with a warranty rather than a used import, China is usually the smartest value. Shipping takes roughly 5–8 weeks.",
  },
  {
    q: "How long does it take to import a vehicle?",
    a: "Typically 6–10 weeks from order to delivery, depending on the source region. Vehicles from the USA usually take 6–8 weeks; from Europe, 4–6 weeks; from China, 5–8 weeks. You can track your vehicle live throughout the journey.",
  },
  {
    q: "What documents do I need for an instalment plan?",
    a: "For DMECH Direct Finance: a valid government ID, your BVN, and a guarantor. For Partner Finance (fulfilled through Autochek, our registered financing partner): additionally an employment letter or proof of income and a 6-month bank statement. We'll guide you through exactly what's needed for your chosen plan.",
  },
  {
    q: "Can I really start paying before the car arrives?",
    a: "Yes — that's the DMECH advantage. Once you pay your deposit and we purchase your vehicle, you begin your instalments while it's still shipping. By the time it clears customs, you've already paid down a significant portion.",
  },
  {
    q: "How do I know the vehicle isn't damaged or salvaged?",
    a: "Every vehicle comes with a verified history report showing accident records, title status, and mileage where available. We inspect before purchase and again on arrival. If a vehicle doesn't meet standards, we don't sell it as certified.",
  },
  {
    q: "What happens if I miss a payment?",
    a: "We'll reach out via WhatsApp with a reminder. DMECH holds the vehicle title until the final payment, and a guarantor backs every instalment plan. We work with customers facing genuine difficulty — communication is key. Full terms are explained before you sign.",
  },
  {
    q: "Are the calculator prices exact?",
    a: "The calculator gives a close estimate based on typical market values and the current duty rates. The final price depends on the specific vehicle's condition and the exchange rate on the day. Request an exact quote and our team confirms the real figure — no hidden surprises.",
  },
  {
    q: "Can I service my vehicle at DMECH after buying?",
    a: "Absolutely. DMECH is a full automotive hub — we service and maintain the vehicles we sell, source genuine spare parts, and keep a complete service history for your car. Your vehicle has a home with us.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section" id="faq">
      <div className="section-inner">
        <div className="section-eyebrow">Questions</div>
        <div className="section-title">Frequently Asked Questions</div>
        <div className="section-subtitle">Everything you need to know before you import.</div>
        <div>
          {FAQS.map((item, i) => (
            <div className={`faq-item ${openIndex === i ? "open" : ""}`} key={item.q}>
              <button className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                {item.q}
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
