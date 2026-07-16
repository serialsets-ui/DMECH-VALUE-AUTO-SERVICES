import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { PlatformSettingsForm } from "@/components/ops/PlatformSettingsForm";
import { roleGuard } from "@/lib/guards";
import { getConfigValue } from "@/lib/platform-config";
import { DEFAULT_TIER_THRESHOLDS, type ApprovalTierThresholds } from "@/lib/approval";

interface PartsCreditLimits {
  retail: number;
  wholesale_auto: number;
  wholesale_manual: number;
}

export default async function PlatformSettingsPage() {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) redirect("/ops/dashboard");

  const [
    ngnUsdRate,
    dmechServiceFeePct,
    defaultDepositPct,
    defaultTenorMonths,
    reservationHoldHours,
    maxSelfFinanceKobo,
    warrantyReserveContributionPct,
    approvalTierThresholds,
    partsCreditLimits,
    reminderDays,
  ] = await Promise.all([
    getConfigValue("ngn_usd_rate", 1580),
    getConfigValue("dmech_service_fee_pct", 8),
    getConfigValue("default_deposit_pct", 40),
    getConfigValue("default_tenor_months", 6),
    getConfigValue("reservation_hold_hours", 48),
    getConfigValue("max_self_finance_kobo", 1_500_000_000),
    getConfigValue("warranty_reserve_contribution_pct", 5),
    getConfigValue<ApprovalTierThresholds>("approval_tier_thresholds_kobo", DEFAULT_TIER_THRESHOLDS),
    getConfigValue<PartsCreditLimits>("parts_credit_limits", { retail: 50_000_000, wholesale_auto: 200_000_000, wholesale_manual: 500_000_000 }),
    getConfigValue<number[]>("reminder_days", [1, 3, 7]),
  ]);

  return (
    <>
      <TopBar title="Platform Settings" />
      <div className="ops-content">
        <PlatformSettingsForm
          ngnUsdRate={ngnUsdRate}
          dmechServiceFeePct={dmechServiceFeePct}
          defaultDepositPct={defaultDepositPct}
          defaultTenorMonths={defaultTenorMonths}
          reservationHoldHours={reservationHoldHours}
          maxSelfFinanceKobo={maxSelfFinanceKobo}
          warrantyReserveContributionPct={warrantyReserveContributionPct}
          approvalTierThresholds={approvalTierThresholds}
          partsCreditLimits={partsCreditLimits}
          reminderDays={reminderDays}
        />
      </div>
    </>
  );
}
