import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "FAQ — DMECH Value Auto Services",
  description: "Everything you need to know before you import or buy a certified vehicle.",
};

export default function FAQPage() {
  return (
    <div className="page-fade">
      <Reveal>
        <FAQ />
      </Reveal>
    </div>
  );
}
