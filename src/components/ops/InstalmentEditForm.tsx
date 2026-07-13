"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InstalmentStatus } from "@/types";

interface Props {
  instalmentId: string;
  status: InstalmentStatus;
  depositPaid: boolean;
}

export function InstalmentEditForm({ instalmentId, status, depositPaid }: Props) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState<InstalmentStatus>(status);
  const [deposit, setDeposit] = useState(depositPaid);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/instalments/${instalmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue, deposit_paid: deposit }),
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
      <div className="ops-panel-title">Edit Instalment</div>

      <label className="ops-field-label" htmlFor="inst-status">
        Status
      </label>
      <select
        id="inst-status"
        className="ops-input"
        value={statusValue}
        onChange={(e) => setStatusValue(e.target.value as InstalmentStatus)}
      >
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="defaulted">Defaulted</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "var(--text)" }}>
        <input type="checkbox" checked={deposit} onChange={(e) => setDeposit(e.target.checked)} />
        Deposit paid
      </label>

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
