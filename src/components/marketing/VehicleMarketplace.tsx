"use client";

import { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/money";
import {
  isCertified,
  displayStatus,
  type PublicVehicle,
  type PublicDisplayStatus,
} from "@/lib/vehicle-display";
import { VehicleDetailModal } from "@/components/marketing/VehicleDetailModal";

const FILTERS = [
  "All",
  "Available",
  "In Transit",
  "At Port",
  "⚡ EVs",
  "✅ Certified Nigerian-Used",
] as const;
type Filter = (typeof FILTERS)[number];

// Plain lowercase keys for ?filter= deep links (e.g. from the Home page's EV
// teaser) — kept separate from the emoji-labeled display strings so URLs
// stay clean and don't need encoding.
const FILTER_FROM_QUERY: Record<string, Filter> = {
  all: "All",
  available: "Available",
  "in-transit": "In Transit",
  "at-port": "At Port",
  ev: "⚡ EVs",
  certified: "✅ Certified Nigerian-Used",
};

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
  const [filter, setFilter] = useState<Filter>(
    (initialFilterKey && FILTER_FROM_QUERY[initialFilterKey]) || "All",
  );
  const [selected, setSelected] = useState<PublicVehicle | null>(null);

  const filtered = vehicles.filter((v) => {
    if (filter === "All") return true;
    if (filter === "⚡ EVs") return v.fuel_type === "electric";
    if (filter === "✅ Certified Nigerian-Used") return isCertified(v);
    return displayStatus(v) === filter;
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
          <span style={{ fontSize: 20 }}>✅</span>
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
              key={f}
              className={`vf-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {vehicles.length === 0 ? (
          <div className="vehicle-empty">
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚗</div>
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
            {filtered.map((v) => {
              const status = displayStatus(v);
              const certified = isCertified(v);
              return (
                <div className="v-card" key={v.id} onClick={() => setSelected(v)}>
                  <div className="v-card-img">
                    {v.fuel_type === "electric" ? "⚡" : "🚗"}
                    <div className={`v-card-status ${STATUS_CLASS[status]}`}>{status}</div>
                    {certified && <div className="v-card-cert">✅ Certified</div>}
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
