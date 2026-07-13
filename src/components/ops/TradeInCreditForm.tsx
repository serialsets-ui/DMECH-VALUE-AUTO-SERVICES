"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/money";

interface InstalmentOption {
  id: string;
  total_price_kobo: number;
  customers: { full_name: string } | null;
}

interface Props {
  vehicleId: string;
  tradeInCreditKobo: number | null;
  instalments: InstalmentOption[];
}

export function TradeInCreditForm({ vehicleId, tradeInCreditKobo, instalments }: Props) {
  const router = useRouter();
  const [instalmentId, setInstalmentId] = useState(instalments[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    if (!instalmentId) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/apply-trade-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instalment_id: instalmentId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Apply Trade-In Credit</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        Credit: {tradeInCreditKobo ? formatNaira(tradeInCreditKobo) : "not set"}. Applies against the
        selected instalment&apos;s deposit.
      </p>

      {instalments.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--subtle)" }}>No open instalment plans to apply this credit to.</div>
      ) : (
        <>
          <label className="ops-field-label" htmlFor="trade-in-instalment">
            Apply To Instalment
          </label>
          <select
            id="trade-in-instalment"
            className="ops-input"
            value={instalmentId}
            onChange={(e) => setInstalmentId(e.target.value)}
          >
            {instalments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.customers?.full_name ?? "Unknown customer"} — {formatNaira(i.total_price_kobo)}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="ops-btn" onClick={apply} disabled={status === "saving"}>
              {status === "saving" ? "Applying..." : "Apply Credit"}
            </button>
            {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
          </div>
        </>
      )}
    </div>
  );
}
