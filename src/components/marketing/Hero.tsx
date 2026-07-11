import { Calculator } from "@/components/marketing/Calculator";

interface HeroProps {
  ngnRate: number;
  marketPriceBenchmarks: Record<string, number>;
}

export function Hero({ ngnRate, marketPriceBenchmarks }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="hero-badge">
            <span className="pulse" /> Import duties reduced — effective July 1, 2026
          </div>
          <h1>
            Import Your Vehicle. <span>Pay Your Way.</span>
          </h1>
          <p>
            DMECH handles everything — from sourcing your vehicle in the USA or Europe to
            clearing it at Lagos ports. Transparent pricing, verified history, and instalment
            plans that start while your car is still on the water.
          </p>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-value">5%</div>
              <div className="hero-stat-label">Used Levy (was 15%)</div>
            </div>
            <div>
              <div className="hero-stat-value">10%</div>
              <div className="hero-stat-label">New Levy (was 20%)</div>
            </div>
            <div>
              <div className="hero-stat-value">40%</div>
              <div className="hero-stat-label">Tariff (was 70%)</div>
            </div>
          </div>
        </div>
        <Calculator ngnRate={ngnRate} marketPriceBenchmarks={marketPriceBenchmarks} />
      </div>
    </section>
  );
}
