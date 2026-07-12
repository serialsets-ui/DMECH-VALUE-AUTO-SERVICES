import { redirect } from "next/navigation";
import "@/styles/ops.css";
import { OpsShell } from "@/components/ops/OpsShell";
import { staffGuard } from "@/lib/guards";

// Redundant with middleware's coarse "is there a session" check by design —
// middleware only confirms a session exists, not that it belongs to an
// active staff `users` row with a non-customer role. staffGuard() checks
// that specifically; defense in depth, not duplication.
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  return (
    <div data-theme="dark">
      <OpsShell>{children}</OpsShell>
    </div>
  );
}
