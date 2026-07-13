"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";
import { stageLabel } from "@/lib/ops/vehicle-stage";
import type { LifecycleStage, VehicleCondition } from "@/types";

interface Props {
  vehicleId: string;
  stages: LifecycleStage[];
  lifecycleStage: LifecycleStage;
  salePriceKobo: number | null;
  condition: VehicleCondition | null;
  colour: string | null;
  videoUrl: string | null;
}

type Status = "idle" | "saving" | "saved" | "error";

// certification_status is deliberately not editable here — it only ever
// changes through the InspectionPanel's "Certify & Issue Warranty" action,
// which creates the matching warranty_policies row in the same step. A
// plain dropdown here previously let staff mark a vehicle "Certified" with
// no warranty behind it, which the marketing site's isCertified() check
// would silently disagree with.
export function VehicleEditForm({
  vehicleId,
  stages,
  lifecycleStage,
  salePriceKobo,
  condition,
  colour,
  videoUrl,
}: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<LifecycleStage>(lifecycleStage);
  const [priceNaira, setPriceNaira] = useState(
    salePriceKobo ? String(Math.round(fromKobo(salePriceKobo))) : "",
  );
  const [cond, setCond] = useState<VehicleCondition | "">(condition ?? "");
  const [colourValue, setColourValue] = useState(colour ?? "");
  const [video, setVideo] = useState(videoUrl ?? "");
  const [status, setStatus] = useState<Status>("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lifecycle_stage: stage,
          sale_price_kobo: priceNaira ? toKobo(parseFloat(priceNaira)) : null,
          condition: cond || null,
          colour: colourValue || null,
          video_url: video || null,
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
      <div className="ops-panel-title">Edit Vehicle</div>

      <label className="ops-field-label" htmlFor="veh-stage">
        Lifecycle Stage
      </label>
      <select
        id="veh-stage"
        className="ops-input"
        value={stage}
        onChange={(e) => setStage(e.target.value as LifecycleStage)}
      >
        {stages.map((s) => (
          <option key={s} value={s}>
            {stageLabel(s)}
          </option>
        ))}
      </select>

      <label className="ops-field-label" htmlFor="veh-price">
        Sale Price (₦)
      </label>
      <input
        id="veh-price"
        className="ops-input"
        type="number"
        value={priceNaira}
        onChange={(e) => setPriceNaira(e.target.value)}
      />

      <label className="ops-field-label" htmlFor="veh-condition">
        Condition
      </label>
      <select
        id="veh-condition"
        className="ops-input"
        value={cond}
        onChange={(e) => setCond(e.target.value as VehicleCondition)}
      >
        <option value="used">Used (Tokunbo)</option>
        <option value="new">Brand New</option>
      </select>

      <label className="ops-field-label" htmlFor="veh-colour">
        Colour
      </label>
      <input
        id="veh-colour"
        className="ops-input"
        value={colourValue}
        onChange={(e) => setColourValue(e.target.value)}
      />

      <label className="ops-field-label" htmlFor="veh-video">
        Video URL (optional)
      </label>
      <input
        id="veh-video"
        className="ops-input"
        placeholder="https://youtube.com/..."
        value={video}
        onChange={(e) => setVideo(e.target.value)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {status === "saved" && (
          <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>
        )}
        {status === "error" && (
          <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>
        )}
      </div>
    </div>
  );
}
