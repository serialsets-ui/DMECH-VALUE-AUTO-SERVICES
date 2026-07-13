"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  shipmentId: string;
  progressPct: number;
  eta: string | null;
  vesselName: string | null;
  trackingUrl: string | null;
  departedAt: string | null;
  containerNumber: string | null;
  billOfLading: string | null;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function ShipmentEditForm({
  shipmentId,
  progressPct,
  eta,
  vesselName,
  trackingUrl,
  departedAt,
  containerNumber,
  billOfLading,
}: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState(String(progressPct));
  const [etaValue, setEtaValue] = useState(toDateInputValue(eta));
  const [vessel, setVessel] = useState(vesselName ?? "");
  const [tracking, setTracking] = useState(trackingUrl ?? "");
  const [departed, setDeparted] = useState(toDateInputValue(departedAt));
  const [container, setContainer] = useState(containerNumber ?? "");
  const [bol, setBol] = useState(billOfLading ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progress_pct: parseInt(progress, 10) || 0,
          eta: etaValue || null,
          vessel_name: vessel || null,
          tracking_url: tracking || null,
          departed_at: departed || null,
          container_number: container || null,
          bill_of_lading: bol || null,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Edit Shipment</div>

      <label className="ops-field-label" htmlFor="ship-progress">
        Progress (%)
      </label>
      <input id="ship-progress" className="ops-input" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-departed">
        Departed
      </label>
      <input id="ship-departed" className="ops-input" type="date" value={departed} onChange={(e) => setDeparted(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-eta">
        ETA
      </label>
      <input id="ship-eta" className="ops-input" type="date" value={etaValue} onChange={(e) => setEtaValue(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-vessel">
        Vessel Name
      </label>
      <input id="ship-vessel" className="ops-input" value={vessel} onChange={(e) => setVessel(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-tracking">
        Tracking URL
      </label>
      <input id="ship-tracking" className="ops-input" value={tracking} onChange={(e) => setTracking(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-container">
        Container Number
      </label>
      <input id="ship-container" className="ops-input" value={container} onChange={(e) => setContainer(e.target.value)} />

      <label className="ops-field-label" htmlFor="ship-bol">
        Bill of Lading
      </label>
      <input id="ship-bol" className="ops-input" value={bol} onChange={(e) => setBol(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {status === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {status === "error" && <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>}
      </div>
    </div>
  );
}
