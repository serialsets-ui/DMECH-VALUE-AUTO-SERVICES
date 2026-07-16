import Link from "next/link";
import { Briefcase, Users, HardHat, UtensilsCrossed, Truck } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import { USE_CATEGORY_LABELS, USE_CATEGORY_DESCRIPTIONS, type VehicleUseCategory } from "@/types";

const ICONS: Record<VehicleUseCategory, typeof Briefcase> = {
  corporate: Briefcase,
  family: Users,
  construction: HardHat,
  catering: UtensilsCrossed,
  logistics: Truck,
};

const CATEGORIES = Object.keys(USE_CATEGORY_LABELS) as VehicleUseCategory[];

// Deliberately no vehicle counts shown here — with inventory still building
// out, most categories would read "0" today. Each card just links into the
// already-honest empty state on /vehicles (see VehicleMarketplace.tsx),
// rather than this section making a claim about how much is in stock.
export function UseCategoryTeaser() {
  return (
    <section className="section" style={{ background: "#fff" }} id="shop-by-use">
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">Shop By Use</div>
          <div className="section-title">Find the Right Vehicle for What You Do</div>
          <div className="section-subtitle">
            Browse inventory suited to your actual need, not just make and model.
          </div>
        </Reveal>
        <div className="trust-grid">
          {CATEGORIES.map((cat, i) => {
            const Icon = ICONS[cat];
            return (
              <Reveal key={cat} delayMs={i * 80}>
                <Link href={`/vehicles?filter=${cat}`} className="trust-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div className="trust-icon">
                    <Icon size={24} strokeWidth={1.75} />
                  </div>
                  <div className="trust-title">{USE_CATEGORY_LABELS[cat]}</div>
                  <div className="trust-desc">{USE_CATEGORY_DESCRIPTIONS[cat]}</div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
