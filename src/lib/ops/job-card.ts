import type { JobCard } from "@/types";

// Shared so the Workshop list and job card detail page never disagree on
// how a given priority is coloured.
export const PRIORITY_CLASS: Record<JobCard["priority"], string> = {
  low: "ops-badge-muted",
  medium: "ops-badge-amber",
  high: "ops-badge-red",
};

export const PRIORITY_LABEL: Record<JobCard["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
