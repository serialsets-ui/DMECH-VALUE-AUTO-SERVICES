"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";
import { stageLabel } from "@/lib/ops/vehicle-stage";
import type { LifecycleStage, VehicleCondition, SourceRegion } from "@/types";

interface Props {
  vehicleId: string;
  stages: LifecycleStage[];
  lifecycleStage: LifecycleStage;
  salePriceKobo: number | null;
  condition: VehicleCondition | null;
  sourceRegion: SourceRegion | null;
  colour: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  lotNumber: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
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
  sourceRegion,
  colour,
  videoUrl,
  isPublished,
  lotNumber,
  seoTitle,
  seoDescription,
}: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<LifecycleStage>(lifecycleStage);
  const [priceNaira, setPriceNaira] = useState(
    salePriceKobo ? String(Math.round(fromKobo(salePriceKobo))) : "",
  );
  const [cond, setCond] = useState<VehicleCondition | "">(condition ?? "");
  const [colourValue, setColourValue] = useState(colour ?? "");
  const [video, setVideo] = useState(videoUrl ?? "");
  const [published, setPublished] = useState(isPublished);
  const [lotNumberValue, setLotNumberValue] = useState(lotNumber ?? "");
  const [seoTitleValue, setSeoTitleValue] = useState(seoTitle ?? "");
  const [seoDescriptionValue, setSeoDescriptionValue] = useState(seoDescription ?? "");
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
          is_published: published,
          lot_number: lotNumberValue || null,
          seo_title: seoTitleValue || null,
          seo_description: seoDescriptionValue || null,
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
        {/* "Tokunbo" specifically means foreign-used — wrong label for a
            Nigerian-sourced vehicle, so it's derived from sourceRegion
            rather than a fixed string (see lib/vehicle-display.ts). */}
        <option value="used">{sourceRegion === "nigeria" ? "Used (Nigerian Used)" : "Used (Tokunbo)"}</option>
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

      <label className="ops-field-label" htmlFor="veh-lot">
        Lot Number (optional — auction reference)
      </label>
      <input
        id="veh-lot"
        className="ops-input"
        value={lotNumberValue}
        onChange={(e) => setLotNumberValue(e.target.value)}
      />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13.5 }}>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published — visible on the marketing site
      </label>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--subtle)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
          SEO (not yet live)
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          There is no public per-vehicle page yet (vehicle detail is a modal on /vehicles), so
          these fields don&apos;t show up anywhere for a customer or search engine yet — saved
          here so the data exists once that page is built.
        </div>
      </div>

      <label className="ops-field-label" htmlFor="veh-seo-title">
        SEO Title
      </label>
      <input
        id="veh-seo-title"
        className="ops-input"
        value={seoTitleValue}
        onChange={(e) => setSeoTitleValue(e.target.value)}
      />

      <label className="ops-field-label" htmlFor="veh-seo-desc">
        SEO Description
      </label>
      <textarea
        id="veh-seo-desc"
        className="ops-input"
        rows={2}
        value={seoDescriptionValue}
        onChange={(e) => setSeoDescriptionValue(e.target.value)}
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
