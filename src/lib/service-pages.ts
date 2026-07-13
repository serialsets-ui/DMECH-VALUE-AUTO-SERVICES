// One dedicated page per workshop service category, for local SEO (Lagos-
// targeted). Slugs and names correspond to the categories already defined
// in ServiceBookingForm.tsx's SERVICES list — no new categories invented.
// Copy stays honest and generic (what's covered, no fabricated
// certifications) matching the honesty-gate convention used everywhere
// else on this site.
import {
  Search,
  Cog,
  Zap,
  Snowflake,
  Car,
  Disc,
  Paintbrush,
  BatteryCharging,
  Wrench,
  Phone,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export interface ServicePageData {
  slug: string;
  name: string;
  icon: LucideIcon;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  covers: string[];
}

export const SERVICE_PAGES: ServicePageData[] = [
  {
    slug: "diagnostics",
    name: "Car Diagnostics",
    icon: Search,
    seoTitle: "Car Diagnostics in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Computerized car diagnostics in Lagos — find the real fault before you pay for repairs. Book a diagnostic check with DMECH's workshop.",
    intro:
      "Not sure what's actually wrong with your car? Our diagnostic check reads your vehicle's onboard computer and inspects the affected systems directly, so you know the real fault before any repair work starts — not a guess.",
    covers: [
      "Engine warning light investigation",
      "Onboard computer (OBD) fault code reading",
      "Sensor and wiring checks",
      "Pre-purchase inspection for used vehicles",
    ],
  },
  {
    slug: "engine",
    name: "Engine Repair",
    icon: Cog,
    seoTitle: "Engine Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Engine repair and overhaul in Lagos — knocking, overheating, oil leaks, and full engine replacement. Book with DMECH's workshop.",
    intro:
      "From a knocking sound to a full engine replacement, our workshop handles engine problems at every level — diagnosed properly first, then repaired or replaced with parts matched to your vehicle.",
    covers: [
      "Engine knocking, overheating, and oil leak repair",
      "Head gasket repair",
      "Timing belt/chain replacement",
      "Full engine replacement (used or new)",
    ],
  },
  {
    slug: "electrical",
    name: "Auto Electrical Repair",
    icon: Zap,
    seoTitle: "Car Electrical Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Car battery, alternator, starter motor, and ignition repair in Lagos. Book an auto electrical diagnosis with DMECH's workshop.",
    intro:
      "Won't start, battery keeps dying, dashboard lights acting up — our electricians trace the fault to its actual source rather than replacing parts by trial and error.",
    covers: [
      "Battery testing and replacement",
      "Alternator repair and replacement",
      "Starter motor repair",
      "Ignition system and wiring faults",
    ],
  },
  {
    slug: "ac",
    name: "Car AC Repair",
    icon: Snowflake,
    seoTitle: "Car AC Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Car air conditioning repair and regas in Lagos — blowing warm, weak airflow, or AC not turning on. Book with DMECH's workshop.",
    intro:
      "Lagos heat makes a working AC non-negotiable. Whether it's blowing warm, barely blowing at all, or not switching on, we find out why before recommending a fix.",
    covers: [
      "AC regas (refrigerant top-up)",
      "Compressor repair and replacement",
      "Blocked or leaking AC lines",
      "Cabin filter and blower issues",
    ],
  },
  {
    slug: "suspension",
    name: "Suspension Repair",
    icon: Car,
    seoTitle: "Suspension Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Shock absorber, strut, and suspension repair in Lagos — for a smoother ride and safer handling on Lagos roads. Book with DMECH.",
    intro:
      "Lagos roads are hard on suspension. A bouncy ride, uneven tyre wear, or clunking over bumps usually points to worn suspension components — we inspect and replace only what's actually worn.",
    covers: [
      "Shock absorber and strut replacement",
      "Bushings and control arm repair",
      "Wheel alignment referral",
      "Noise and handling diagnosis",
    ],
  },
  {
    slug: "brakes",
    name: "Brake Repair",
    icon: Disc,
    seoTitle: "Brake Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Brake pad, disc, and fluid service in Lagos — squealing, grinding, or a soft brake pedal. Book a brake inspection with DMECH's workshop.",
    intro:
      "Brakes aren't something to delay. Squealing, grinding, or a pedal that feels soft are all signs worth checking immediately — we inspect the full system, not just the pads.",
    covers: [
      "Brake pad replacement",
      "Brake disc/rotor service",
      "Brake fluid change",
      "Full brake system inspection",
    ],
  },
  {
    slug: "body-paint",
    name: "Body & Paint",
    icon: Paintbrush,
    seoTitle: "Car Body Repair & Paint in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Dent repair, scratch removal, panel beating, and paint matching in Lagos. Book a body and paint job with DMECH's workshop.",
    intro:
      "Dents, scratches, and accident damage affect your car's value as much as its looks. Our body shop repairs the panel and matches the paint, not just covers the damage.",
    covers: [
      "Dent and scratch repair",
      "Panel beating and replacement",
      "Accident damage repair",
      "Full or partial respray with colour matching",
    ],
  },
  {
    slug: "ev-service",
    name: "EV Service",
    icon: BatteryCharging,
    seoTitle: "EV Service & Repair in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Electric vehicle servicing in Lagos — battery health checks, charging issues, and EV-specific maintenance. Book with DMECH's workshop.",
    intro:
      "EVs need a different kind of care than a combustion engine. As Nigeria's EV market grows, our workshop is building the expertise to service them properly — battery health, charging systems, and EV-specific components.",
    covers: [
      "Battery health check",
      "Charging system diagnosis",
      "EV-specific maintenance",
      "Software and system updates where applicable",
    ],
  },
  {
    slug: "routine-maintenance",
    name: "Routine Maintenance",
    icon: Wrench,
    seoTitle: "Car Servicing in Lagos — DMECH Value Auto Services",
    seoDescription:
      "Interim and full car servicing in Lagos — oil change, fluid checks, and scheduled maintenance. Book a service with DMECH's workshop.",
    intro:
      "Regular servicing catches small problems before they become expensive ones. We follow your vehicle's actual service schedule, not a one-size-fits-all checklist.",
    covers: [
      "Engine oil and filter change",
      "Fluid top-ups and replacement",
      "Multi-point vehicle inspection",
      "Scheduled service intervals",
    ],
  },
];

export function getServicePage(slug: string): ServicePageData | undefined {
  return SERVICE_PAGES.find((s) => s.slug === slug);
}

// Shared "What To Expect" checklist — used on the main /service page and
// every category page for consistency.
export const WHAT_TO_EXPECT: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Phone,
    title: "Confirmation within 30 minutes",
    desc: "We'll call or WhatsApp to confirm your booking and give you a time slot.",
  },
  {
    icon: Receipt,
    title: "A clear quote before work starts",
    desc: "No work begins until you've agreed a price — no surprise charges at pickup.",
  },
  {
    icon: Wrench,
    title: "Updates while it's in the workshop",
    desc: "You'll hear from us if anything changes once the job is underway, not just when it's done.",
  },
  {
    icon: Car,
    title: "Your vehicle back on schedule",
    desc: "We tell you when to expect it and stick to it.",
  },
];
