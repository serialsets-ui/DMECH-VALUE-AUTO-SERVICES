"use client";

import { useState } from "react";
import type { Specialist } from "@/types";

export function SpecialistManager({ specialists }: { specialists: Specialist[] }) {
  const [roster, setRoster] = useState(specialists);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sharePct, setSharePct] = useState("40");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function addSpecialist() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, specialty, share_pct: sharePct }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setRoster((prev) => [...prev, json.specialist]);
      setName("");
      setSpecialty("");
      setSharePct("40");
      setStatus("idle");
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  async function updateSpecialist(id: string, updates: Partial<Pick<Specialist, "status" | "share_pct">>) {
    setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    await fetch(`/api/specialists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  return (
    <>
      <div className="ops-panel" style={{ maxWidth: 480 }}>
        <div className="ops-panel-title">Add Specialist</div>

        <label className="ops-field-label" htmlFor="spec-name">Name</label>
        <input id="spec-name" className="ops-input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="ops-field-label" htmlFor="spec-specialty">Specialty (optional)</label>
        <input id="spec-specialty" className="ops-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />

        <label className="ops-field-label" htmlFor="spec-share">Revenue Share (%)</label>
        <input id="spec-share" className="ops-input" type="number" value={sharePct} onChange={(e) => setSharePct(e.target.value)} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="ops-btn" onClick={addSpecialist} disabled={status === "saving" || !name}>
            {status === "saving" ? "Adding..." : "Add Specialist"}
          </button>
          {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
        </div>
      </div>

      <div className="ops-table-wrap" style={{ marginTop: 16 }}>
        <table className="ops-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Jobs Completed</th>
              <th>Revenue Share</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.specialty ?? "—"}</td>
                <td>{s.jobs_completed}</td>
                <td>
                  <input
                    type="number"
                    className="ops-input"
                    style={{ marginBottom: 0, width: 80 }}
                    value={s.share_pct}
                    onChange={(e) => updateSpecialist(s.id, { share_pct: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <select
                    className="ops-input"
                    style={{ marginBottom: 0, width: "auto" }}
                    value={s.status}
                    onChange={(e) => updateSpecialist(s.id, { status: e.target.value as Specialist["status"] })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
