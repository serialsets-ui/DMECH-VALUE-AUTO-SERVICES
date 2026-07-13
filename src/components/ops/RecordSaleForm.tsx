"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AcquisitionChannel, CertificationStatus } from "@/types";

interface Props {
  vehicleId: string;
  acquisitionChannel: AcquisitionChannel;
  certificationStatus: CertificationStatus;
}

export function RecordSaleForm({ vehicleId, acquisitionChannel, certificationStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function recordSale() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/sell`, { method: "POST" });
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
      <div className="ops-panel-title">Record Sale</div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        Marks this vehicle sold at its current sale price.
        {acquisitionChannel === "consignment" && " The consignor payout will be computed and recorded automatically."}
        {certificationStatus === "certified" && " The warranty reserve accrual will be recorded automatically."}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={recordSale} disabled={status === "saving"}>
          {status === "saving" ? "Recording..." : "Mark as Sold"}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
