"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvalsRequired } from "@/lib/approval";
import type { ApprovalStatus } from "@/types";

interface Props {
  customerId: string;
  approvalStatus: ApprovalStatus;
  approvalTier: 1 | 2 | 3 | 4 | null;
  approvedByCount: number;
  alreadyApprovedByMe: boolean;
}

export function CustomerApprovalPanel({ customerId, approvalStatus, approvalTier, approvedByCount, alreadyApprovedByMe }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const required = approvalsRequired(approvalTier ?? 1);

  async function act(action: "approve" | "decline") {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("idle");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  if (approvalStatus === "approved" || approvalStatus === "declined") {
    return (
      <div className="ops-panel">
        <div className="ops-panel-title">Approval</div>
        <div style={{ fontSize: 13, color: approvalStatus === "approved" ? "var(--green)" : "var(--red)" }}>
          This customer has already been {approvalStatus}.
        </div>
      </div>
    );
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Approval</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        {approvalTier && approvalTier >= 3
          ? `Tier ${approvalTier} — needs ${required} approvals (${approvedByCount} of ${required} so far).`
          : `Tier ${approvalTier ?? 1} — needs ${required} approval.`}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="ops-btn"
          onClick={() => act("approve")}
          disabled={status === "saving" || alreadyApprovedByMe}
        >
          {alreadyApprovedByMe ? "You've Approved" : status === "saving" ? "Saving..." : "Approve"}
        </button>
        <button
          className="ops-btn"
          style={{ background: "var(--red-d)", color: "var(--red)" }}
          onClick={() => act("decline")}
          disabled={status === "saving"}
        >
          Decline
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
