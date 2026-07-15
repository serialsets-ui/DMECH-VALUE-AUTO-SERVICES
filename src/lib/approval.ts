// Customer approval tiers — see migration 009's comment: thresholds are a
// reasonable starting default (not a verified underwriting policy), stored
// in platform_config so they're adjustable without a code change.

export interface ApprovalTierThresholds {
  tier1_max: number;
  tier2_max: number;
  tier3_max: number;
}

export const DEFAULT_TIER_THRESHOLDS: ApprovalTierThresholds = {
  tier1_max: 500_000_000, // ₦5,000,000
  tier2_max: 1_500_000_000, // ₦15,000,000
  tier3_max: 3_000_000_000, // ₦30,000,000
};

export function computeApprovalTier(creditLimitKobo: number, thresholds: ApprovalTierThresholds): 1 | 2 | 3 | 4 {
  if (creditLimitKobo <= thresholds.tier1_max) return 1;
  if (creditLimitKobo <= thresholds.tier2_max) return 2;
  if (creditLimitKobo <= thresholds.tier3_max) return 3;
  return 4;
}

// Tier 3-4 (larger requested credit) need two distinct staff approvals
// before approval_status flips to 'approved'; Tier 1-2 need one.
export function approvalsRequired(tier: 1 | 2 | 3 | 4): number {
  return tier >= 3 ? 2 : 1;
}
