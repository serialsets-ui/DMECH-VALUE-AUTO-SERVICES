"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";
import type { JobCardStage } from "@/types";

interface Props {
  jobCardId: string;
  stage: JobCardStage;
  priority: "low" | "medium" | "high";
  quoteKobo: number | null;
  specialistId: string | null;
  specialists: { id: string; name: string }[];
}

const STAGES: JobCardStage[] = ["reception", "diagnostics", "planning", "execution", "qa", "released"];

export function JobCardEditForm({
  jobCardId,
  stage,
  priority,
  quoteKobo,
  specialistId,
  specialists,
}: Props) {
  const router = useRouter();
  const [stageValue, setStageValue] = useState<JobCardStage>(stage);
  const [priorityValue, setPriorityValue] = useState(priority);
  const [quoteNaira, setQuoteNaira] = useState(quoteKobo ? String(Math.round(fromKobo(quoteKobo))) : "");
  const [specialist, setSpecialist] = useState(specialistId ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/workshop/${jobCardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: stageValue,
          priority: priorityValue,
          quote_kobo: quoteNaira ? toKobo(parseFloat(quoteNaira)) : null,
          specialist_id: specialist || null,
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
      <div className="ops-panel-title">Edit Job Card</div>

      <label className="ops-field-label" htmlFor="jc-stage">
        Stage
      </label>
      <select id="jc-stage" className="ops-input" value={stageValue} onChange={(e) => setStageValue(e.target.value as JobCardStage)}>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <label className="ops-field-label" htmlFor="jc-priority">
        Priority
      </label>
      <select
        id="jc-priority"
        className="ops-input"
        value={priorityValue}
        onChange={(e) => setPriorityValue(e.target.value as "low" | "medium" | "high")}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <label className="ops-field-label" htmlFor="jc-quote">
        Quote (₦)
      </label>
      <input id="jc-quote" className="ops-input" type="number" value={quoteNaira} onChange={(e) => setQuoteNaira(e.target.value)} />

      <label className="ops-field-label" htmlFor="jc-specialist">
        Specialist
      </label>
      <select id="jc-specialist" className="ops-input" value={specialist} onChange={(e) => setSpecialist(e.target.value)}>
        <option value="">Unassigned</option>
        {specialists.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

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
