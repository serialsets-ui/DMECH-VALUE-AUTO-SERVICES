"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromKobo, toKobo } from "@/lib/money";

interface Props {
  partId: string;
  qty: number;
  costPriceKobo: number;
  salePriceKobo: number;
  reorderThreshold: number;
  condition: "tested" | "good" | "excellent" | null;
}

export function PartEditForm({
  partId,
  qty,
  costPriceKobo,
  salePriceKobo,
  reorderThreshold,
  condition,
}: Props) {
  const router = useRouter();
  const [qtyValue, setQtyValue] = useState(String(qty));
  const [costNaira, setCostNaira] = useState(String(Math.round(fromKobo(costPriceKobo))));
  const [saleNaira, setSaleNaira] = useState(String(Math.round(fromKobo(salePriceKobo))));
  const [reorder, setReorder] = useState(String(reorderThreshold));
  const [cond, setCond] = useState(condition ?? "good");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/parts/${partId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qty: parseInt(qtyValue, 10) || 0,
          cost_price_kobo: toKobo(parseFloat(costNaira) || 0),
          sale_price_kobo: toKobo(parseFloat(saleNaira) || 0),
          reorder_threshold: parseInt(reorder, 10) || 0,
          condition: cond,
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
      <div className="ops-panel-title">Edit Part</div>

      <label className="ops-field-label" htmlFor="part-qty">
        Quantity
      </label>
      <input id="part-qty" className="ops-input" type="number" value={qtyValue} onChange={(e) => setQtyValue(e.target.value)} />

      <label className="ops-field-label" htmlFor="part-cost">
        Cost Price (₦)
      </label>
      <input id="part-cost" className="ops-input" type="number" value={costNaira} onChange={(e) => setCostNaira(e.target.value)} />

      <label className="ops-field-label" htmlFor="part-sale">
        Sale Price (₦)
      </label>
      <input id="part-sale" className="ops-input" type="number" value={saleNaira} onChange={(e) => setSaleNaira(e.target.value)} />

      <label className="ops-field-label" htmlFor="part-reorder">
        Reorder Threshold
      </label>
      <input id="part-reorder" className="ops-input" type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} />

      <label className="ops-field-label" htmlFor="part-condition">
        Condition
      </label>
      <select
        id="part-condition"
        className="ops-input"
        value={cond}
        onChange={(e) => setCond(e.target.value as "tested" | "good" | "excellent")}
      >
        <option value="tested">Tested</option>
        <option value="good">Good</option>
        <option value="excellent">Excellent</option>
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
