"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConsignmentPayoutAction({
  vehicleId,
  paidAt,
}: {
  vehicleId: string;
  paidAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/vehicles/${vehicleId}/consignment-payout`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !paidAt }),
    });
    setLoading(false);
    router.refresh();
  }

  return paidAt ? (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="ops-badge ops-badge-green"
      style={{ border: "none", cursor: "pointer" }}
      title={`Paid ${new Date(paidAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })} — click to un-mark`}
    >
      {loading ? "..." : "Paid"}
    </button>
  ) : (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="ops-badge ops-badge-amber"
      style={{ border: "none", cursor: "pointer" }}
    >
      {loading ? "..." : "Mark Paid"}
    </button>
  );
}
