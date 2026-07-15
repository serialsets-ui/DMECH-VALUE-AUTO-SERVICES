// Single source of truth for DMECH's public contact details. Every phone/
// WhatsApp link on the marketing site reads from here — update once when
// the real numbers are ready, instead of hunting down each call site.
//
// PLACEHOLDER: these are not real numbers yet. Swap them here when DMECH
// hands over the actual business line and WhatsApp number.
export const CONTACT = {
  phoneDisplay: "0800-DMECH-00",
  phoneHref: "08000000000",
  whatsappDisplay: "0800 000 0000",
  whatsappNumber: "2348000000000",
  hours: "Mon–Sat: 8am – 6pm",
  addressLine1: "Sangotedo, Ajah Axis,",
  addressLine2: "Lagos, Nigeria",
} as const;

export const ADDRESS_FULL = "Sangotedo, Ajah Axis, Lagos, Nigeria";

// DMECH is a registered dealer/financing partner with Autochek Africa —
// Partner Finance is fulfilled through them. Link is the one confirmed by
// DMECH; swap for a dealer-specific referral URL if/when one exists.
export const AUTOCHEK_URL = "https://autochek.africa/welcome";

export function whatsappHref(message: string): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
