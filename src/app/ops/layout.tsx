// TODO(Phase 2): wrap in staffGuard() from src/lib/guards.ts and render the
// sidebar/topbar shell once staff auth exists. For now this only applies the
// ops platform's dark theme scope so pages built here get the right tokens.
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <div data-theme="dark">{children}</div>;
}
