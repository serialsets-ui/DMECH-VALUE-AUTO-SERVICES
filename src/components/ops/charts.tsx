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

/** Small trend line + area fill, e.g. inside a hero stat card. Purely
 * illustrative of shape/direction -- pair with a real number, never the only
 * representation of a value. */
export function Sparkline({
  data,
  colorVar = "--blue",
  width = 110,
  height = 34,
}: {
  data: number[];
  colorVar?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const linePoints = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="ops-sparkline">
      <polygon points={areaPoints} fill={`var(${colorVar})`} opacity={0.12} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={`var(${colorVar})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill={`var(${colorVar})`} />
    </svg>
  );
}

export function TrendPill({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const isUp = pct >= 0;
  return (
    <span className={`ops-trend-pill ${isUp ? "ops-trend-up" : "ops-trend-down"}`}>
      {isUp ? "↗" : "↘"} {Math.abs(Math.round(pct))}%
    </span>
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
