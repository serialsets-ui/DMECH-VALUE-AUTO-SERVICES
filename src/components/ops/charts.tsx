// Hand-rolled chart primitives for Ops — no charting library dependency
// (matches the project's existing no-Tailwind/no-UI-kit/no-animation-library
// convention, and avoids adding a dependency tree on a build already tight on
// RAM). Pure markup + CSS/SVG, no client-side JS, so these render for free
// inside Server Components.

/** Cycled across the 5 semantic hues when a chart's categories don't map to
 * an existing meaning (e.g. lifecycle stages) — callers with real semantics
 * (paid/overdue/declined) should pass explicit colorVars instead. */
export const CHART_PALETTE = ["--blue", "--orange", "--green", "--amber", "--red"];

interface BarDatum {
  label: string;
  value: number;
  colorVar?: string;
}

export function HorizontalBarChart({
  data,
  formatValue = (n: number) => String(n),
}: {
  data: BarDatum[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="ops-hbar-chart">
      {data.map((d, i) => (
        <div className="ops-hbar-row" key={d.label}>
          <span className="ops-hbar-label">{d.label}</span>
          <span className="ops-hbar-track">
            <span
              className="ops-hbar-fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: `var(${d.colorVar ?? CHART_PALETTE[i % CHART_PALETTE.length]})`,
              }}
            />
          </span>
          <span className="ops-hbar-value">{formatValue(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface DonutDatum {
  label: string;
  value: number;
  colorVar: string;
}

export function DonutChart({
  data,
  size = 128,
  strokeWidth = 18,
  centerLabel,
  formatValue = (n: number) => String(n),
}: {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  formatValue?: (n: number) => string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;

  return (
    <div className="ops-donut-wrap">
      <div className="ops-donut-svg-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
          {total > 0 &&
            data
              .filter((d) => d.value > 0)
              .map((d) => {
                const dash = (d.value / total) * circumference;
                const el = (
                  <circle
                    key={d.label}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={`var(${d.colorVar})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-cumulative}
                    transform={`rotate(-90 ${cx} ${cy})`}
                  />
                );
                cumulative += dash;
                return el;
              })}
        </svg>
        <div className="ops-donut-center">
          <div className="ops-donut-center-value">{centerLabel ?? formatValue(total)}</div>
        </div>
      </div>
      <div className="ops-donut-legend">
        {data.map((d) => (
          <div className="ops-donut-legend-row" key={d.label}>
            <span className="ops-donut-dot" style={{ background: `var(${d.colorVar})` }} />
            <span className="ops-donut-legend-label">{d.label}</span>
            <span className="ops-donut-legend-value">{formatValue(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MonthlyDatum {
  month: string;
  accrued: number;
  paidOut: number;
}

export function MonthlyBarChart({
  data,
  formatValue = (n: number) => String(n),
}: {
  data: MonthlyDatum[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.accrued, d.paidOut]));
  return (
    <div className="ops-monthly-chart">
      {data.map((d) => (
        <div className="ops-monthly-col" key={d.month}>
          <div className="ops-monthly-bars">
            <div
              className="ops-monthly-bar ops-monthly-bar-accrued"
              style={{ height: `${(d.accrued / max) * 100}%` }}
              title={`Accrued: ${formatValue(d.accrued)}`}
            />
            <div
              className="ops-monthly-bar ops-monthly-bar-paid"
              style={{ height: `${(d.paidOut / max) * 100}%` }}
              title={`Paid out: ${formatValue(d.paidOut)}`}
            />
          </div>
          <div className="ops-monthly-label">{d.month}</div>
        </div>
      ))}
      <div className="ops-monthly-legend">
        <span className="ops-monthly-legend-item">
          <span className="ops-donut-dot" style={{ background: "var(--green)" }} /> Accrued
        </span>
        <span className="ops-monthly-legend-item">
          <span className="ops-donut-dot" style={{ background: "var(--red)" }} /> Paid Out
        </span>
      </div>
    </div>
  );
}

export function ProgressMeter({ pct, size = "md" }: { pct: number; size?: "sm" | "md" }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const colorVar = clamped >= 100 ? "--green" : clamped > 0 ? "--blue" : "--subtle";
  return (
    <span className={`ops-progress-meter ops-progress-meter-${size}`}>
      <span className="ops-progress-track">
        <span className="ops-progress-fill" style={{ width: `${clamped}%`, background: `var(${colorVar})` }} />
      </span>
      <span className="ops-progress-pct">{clamped}%</span>
    </span>
  );
}
