"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";

interface Props {
  customsId: string;
  status: string;
  agent: string | null;
  dutyPaidKobo: number | null;
  clearedAt: string | null;
}

export function CustomsEditForm({ customsId, status, agent, dutyPaidKobo, clearedAt }: Props) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(status);
  const [agentValue, setAgentValue] = useState(agent ?? "");
  const [dutyPaidNaira, setDutyPaidNaira] = useState(
    dutyPaidKobo ? String(Math.round(fromKobo(dutyPaidKobo))) : "",
  );
  const [cleared, setCleared] = useState(clearedAt ? clearedAt.slice(0, 10) : "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/customs/${customsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusValue,
          agent: agentValue || null,
          duty_paid_kobo: dutyPaidNaira ? toKobo(parseFloat(dutyPaidNaira)) : null,
          cleared_at: cleared || null,
        }),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saved");
      router.refresh();
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Edit Customs Entry</div>

      <label className="ops-field-label" htmlFor="cust-status">
        Status
      </label>
      <input id="cust-status" className="ops-input" value={statusValue} onChange={(e) => setStatusValue(e.target.value)} />

      <label className="ops-field-label" htmlFor="cust-agent">
        Agent
      </label>
      <input id="cust-agent" className="ops-input" value={agentValue} onChange={(e) => setAgentValue(e.target.value)} />

      <label className="ops-field-label" htmlFor="cust-duty-paid">
        Duty Paid (₦)
      </label>
      <input
        id="cust-duty-paid"
        className="ops-input"
        type="number"
        value={dutyPaidNaira}
        onChange={(e) => setDutyPaidNaira(e.target.value)}
      />

      <label className="ops-field-label" htmlFor="cust-cleared">
        Cleared Date
      </label>
      <input id="cust-cleared" className="ops-input" type="date" value={cleared} onChange={(e) => setCleared(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={save} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {saveStatus === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {saveStatus === "error" && <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>}
      </div>
    </div>
  );
}
