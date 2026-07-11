import "@/styles/ops.css";
import { OpsShell } from "@/components/ops/OpsShell";

// TODO(Phase 2): wrap in staffGuard() from src/lib/guards.ts once staff auth
// exists, and render the sidebar/topbar shell here too. For now this applies
// the ops platform's dark theme scope and the splash/loading screen.
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark">
      <OpsShell>{children}</OpsShell>
    </div>
  );
}
