"use client";

import { useState } from "react";
import type { DmechUser, StaffRole } from "@/types";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "managing_partner", label: "Managing Partner" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "ops_manager", label: "Ops Manager" },
  { value: "workshop_lead", label: "Workshop Lead" },
  { value: "sales_rep", label: "Sales Rep" },
  { value: "accountant", label: "Accountant" },
];

export function StaffManager({
  staff,
  currentUserId,
}: {
  staff: DmechUser[];
  currentUserId: string;
}) {
  const [roster, setRoster] = useState(staff);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("sales_rep");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function addStaff() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, phone, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setRoster((prev) => [...prev, json.staff]);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("sales_rep");
      setStatus("idle");
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  async function updateStaff(id: string, updates: Partial<Pick<DmechUser, "role" | "is_active">>) {
    setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  const activeCount = roster.filter((s) => s.is_active).length;
  const superAdminCount = roster.filter((s) => s.role === "super_admin").length;

  return (
    <>
      <div className="ops-stat-grid" style={{ marginBottom: 20 }}>
        <div className="ops-stat-card">
          <div className="ops-stat-value">{roster.length}</div>
          <div className="ops-stat-label">Total Staff</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-value">{activeCount}</div>
          <div className="ops-stat-label">Active</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-value">{roster.length - activeCount}</div>
          <div className="ops-stat-label">Deactivated</div>
        </div>
        <div className="ops-stat-card">
          <div className="ops-stat-value">{superAdminCount}</div>
          <div className="ops-stat-label">Super Admins</div>
        </div>
      </div>

      <div className="ops-panel" style={{ maxWidth: 620 }}>
        <div className="ops-panel-title">Add Staff</div>

        <div className="ops-form-grid">
          <div>
            <label className="ops-field-label" htmlFor="staff-name">
              Full Name
            </label>
            <input
              id="staff-name"
              className="ops-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="ops-field-label" htmlFor="staff-email">
              Email
            </label>
            <input
              id="staff-email"
              className="ops-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="ops-field-label" htmlFor="staff-phone">
              Phone (optional)
            </label>
            <input
              id="staff-phone"
              className="ops-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="ops-field-label" htmlFor="staff-role">
              Role
            </label>
            <select
              id="staff-role"
              className="ops-input"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="ops-field-label" htmlFor="staff-password">
          Initial Password
        </label>
        <input
          id="staff-password"
          className="ops-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="ops-btn"
            onClick={addStaff}
            disabled={status === "saving" || !fullName || !email || password.length < 8}
          >
            {status === "saving" ? "Adding..." : "Add Staff"}
          </button>
          {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
        </div>
      </div>

      <div className="ops-table-wrap" style={{ marginTop: 16 }}>
        <table className="ops-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => {
              const isSelf = s.id === currentUserId;
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ops-user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {initials(s.full_name)}
                      </span>
                      {s.full_name}
                      {isSelf && <span className="ops-badge ops-badge-muted">You</span>}
                    </div>
                  </td>
                  <td>{s.email}</td>
                  <td>
                    <select
                      className="ops-input"
                      style={{ marginBottom: 0, width: "auto" }}
                      value={s.role}
                      disabled={isSelf}
                      onChange={(e) => updateStaff(s.id, { role: e.target.value as StaffRole })}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.is_active}
                      disabled={isSelf}
                      onChange={(e) => updateStaff(s.id, { is_active: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
