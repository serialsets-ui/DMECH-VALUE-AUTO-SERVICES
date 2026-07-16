"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/money";
import {
  isCertified,
  displayStatus,
  publicPhotos,
  conditionCategory,
  type PublicVehicle,
  type PublicDisplayStatus,
} from "@/lib/vehicle-display";
import { Zap, CheckCircle2, Car, type LucideIcon } from "lucide-react";
import { VehicleDetailModal } from "@/components/marketing/VehicleDetailModal";
import { Reveal } from "@/components/marketing/Reveal";
import { USE_CATEGORY_LABELS, type VehicleUseCategory } from "@/types";

type Filter =
  | "all"
  | "available"
  | "in-transit"
  | "at-port"
  | "foreign-used"
  | "nigerian-used"
  | "ev"
  | "certified"
  | VehicleUseCategory;

const USE_CATEGORY_FILTERS = Object.entries(USE_CATEGORY_LABELS) as [VehicleUseCategory, string][];

// Filter state is keyed on the plain lowercase `key` (also used for the
// ?filter= deep link, e.g. from the Home page's EV teaser or the Shop by Use
// section) — the icon and label are display-only, kept separate from the key.
const FILTERS: { key: Filter; label: string; icon?: LucideIcon }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "in-transit", label: "In Transit" },
  { key: "at-port", label: "At Port" },
  { key: "foreign-used", label: "Foreign Used" },
  { key: "nigerian-used", label: "Nigerian Used" },
  { key: "ev", label: "EVs", icon: Zap },
  { key: "certified", label: "Certified Nigerian-Used", icon: CheckCircle2 },
  ...USE_CATEGORY_FILTERS.map(([key, label]) => ({ key, label })),
];

const STATUS_CLASS: Record<PublicDisplayStatus, string> = {
  Available: "status-available",
  Reserved: "status-available",
  "In Transit": "status-transit",
  "At Port": "status-port",
};

interface Props {
  vehicles: PublicVehicle[];
  defaultDepositPct: number;
  defaultTenorMonths: number;
  initialFilterKey?: string;
}

export function VehicleMarketplace({
  vehicles,
  defaultDepositPct,
  defaultTenorMonths,
  initialFilterKey,
}: Props) {
  const isValidFilter = (k: string): k is Filter => FILTERS.some((f) => f.key === k);
  const [filter, setFilter] = useState<Filter>(
    (initialFilterKey && isValidFilter(initialFilterKey) && initialFilterKey) || "all",
  );
  const [selected, setSelected] = useState<PublicVehicle | null>(null);

  const filtered = vehicles.filter((v) => {
    if (filter === "all") return true;
    if (filter === "ev") return v.fuel_type === "electric";
    if (filter === "certified") return isCertified(v);
    if (filter === "foreign-used") return conditionCategory(v) === "foreign_used";
    if (filter === "nigerian-used") return conditionCategory(v) === "nigerian_used";
    if (filter in USE_CATEGORY_LABELS) return v.use_categories.includes(filter as VehicleUseCategory);
    const statusKey = displayStatus(v).toLowerCase().replace(" ", "-");
    return statusKey === filter;
  });

  return (
    <section className="section" id="vehicles" style={{ background: "#fff" }}>
      <div className="section-inner">
        <div className="section-eyebrow">Vehicle Marketplace</div>
        <div className="section-title">Available Now &amp; In Transit</div>
        <div className="section-subtitle">
          Verified vehicles with full history reports. Every car comes with DMECH documentation
          and inspection guarantee.
        </div>

        <Link
          href="/vehicles/certified"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--green-d)",
            border: "1px solid #BBF7D0",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
            textDecoration: "none",
          }}
        >
          <span style={{ display: "flex", color: "var(--green)" }}>
            <CheckCircle2 size={20} strokeWidth={1.75} />
          </span>
          <span style={{ fontSize: 13, color: "var(--text)", flex: 1 }}>
            <strong style={{ color: "var(--green)" }}>DMECH Certified Nigerian-Used</strong> —
            vehicles already in Nigeria, inspected, title-checked, and sold with a real warranty.
          </span>
          <span className="teaser-link" style={{ fontSize: 13, flexShrink: 0 }}>
            Learn More →
          </span>
        </Link>

        <div className="vehicle-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`vf-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
              style={f.icon ? { display: "inline-flex", alignItems: "center", gap: 6 } : undefined}
            >
              {f.icon && <f.icon size={14} strokeWidth={2} />}
              {f.label}
            </button>
          ))}
        </div>

        {vehicles.length === 0 ? (
          <div className="vehicle-empty">
            <div style={{ display: "flex", justifyContent: "center", color: "var(--subtle)", marginBottom: 12 }}>
              <Car size={32} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>New inventory added regularly</div>
            <div style={{ fontSize: 14 }}>
              We&apos;re currently onboarding our first verified vehicles, including our DMECH
              Certified Nigerian-used program. WhatsApp us for current stock and to be notified
              the moment new vehicles go live.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vehicle-empty">No vehicles match this filter right now — check back soon.</div>
        ) : (
          <div className="vehicle-grid">
            {filtered.map((v, i) => {
              const status = displayStatus(v);
              const certified = isCertified(v);
              const heroPhoto = publicPhotos(v)[0]?.url;
              return (
                <Reveal key={v.id} delayMs={Math.min(i * 40, 400)}>
                <div className="v-card" onClick={() => setSelected(v)}>
                  <div
                    className="v-card-img"
                    style={
                      heroPhoto
                        ? { backgroundImage: `url(${heroPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : undefined
                    }
                  >
                    {!heroPhoto &&
                      (v.fuel_type === "electric" ? (
                        <Zap size={56} strokeWidth={1.25} />
                      ) : (
                        <Car size={56} strokeWidth={1.25} />
                      ))}
                    <div className={`v-card-status ${STATUS_CLASS[status]}`}>{status}</div>
                    {certified && (
                      <div className="v-card-cert" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={13} strokeWidth={2} /> Certified
                      </div>
                    )}
                  </div>
                  <div className="v-card-body">
                    <div className="v-card-name">
                      {v.make} {v.model} {v.year}
                    </div>
                    <div className="v-card-meta">
                      {v.colour} · {v.fuel_type === "electric" ? `${v.battery_range_km ?? "—"} km range` : `${v.engine_cc ?? "—"}cc`} ·{" "}
                      {v.source_region === "nigeria" ? "Nigerian-used" : v.source_detail ?? v.source_region}
                    </div>
                    <div className="v-card-price-row">
                      <div className="v-card-price">
                        {v.sale_price_kobo ? formatNaira(v.sale_price_kobo) : "Price on request"}
                      </div>
                      <div className="v-card-source">
                        {status === "Available" ? "Ready to drive" : status}
                      </div>
                    </div>
                    {v.sale_price_kobo && (
                      <div className="v-card-install">
                        From{" "}
                        <strong>
                          {formatNaira((v.sale_price_kobo * 0.6) / 6)}/month
                        </strong>{" "}
                        with {formatNaira(v.sale_price_kobo * 0.4)} deposit (6 months)
                      </div>
                    )}
                    <div className="v-card-actions">
                      <button className="v-card-btn btn-primary">
                        {status === "Available" ? "Reserve Now" : "Notify on Arrival"}
                      </button>
                      <button className="v-card-btn btn-outline">Details</button>
                    </div>
                  </div>
                </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <VehicleDetailModal
          vehicle={selected}
          onClose={() => setSelected(null)}
          defaultDepositPct={defaultDepositPct}
          defaultTenorMonths={defaultTenorMonths}
        />
      )}
    </section>
  );
}
