import type { LifecycleStage } from "@/types";

const SHIPPING_STAGES: LifecycleStage[] = ["shipped", "in_transit", "at_port", "customs", "cleared"];

/** "in_transit" -> "In Transit" */
export function stageLabel(stage: LifecycleStage): string {
  return stage
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function stageBadgeClass(stage: LifecycleStage): string {
  if (stage === "available") return "ops-badge-green";
  if (stage === "reserved") return "ops-badge-amber";
  if (SHIPPING_STAGES.includes(stage)) return "ops-badge-blue";
  return "ops-badge-muted"; // intake/inspection/sourced/purchased, sold/delivered
}
