import type { Metadata } from "next";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Trust } from "@/components/marketing/Trust";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "About Us — DMECH Value Auto Services",
  description:
    "How DMECH's import and certification process works, why it's different from the informal car market, and what customers say.",
};

export default function AboutPage() {
  return (
    <div className="page-fade">
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <Trust />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
    </div>
  );
}
