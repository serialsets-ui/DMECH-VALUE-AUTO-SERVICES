import { SignOutButton } from "@/components/ops/SignOutButton";

export default function OpsDashboard() {
  return (
    <main style={{ padding: 40, background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Ops Dashboard</h1>
          <p style={{ color: "var(--muted)" }}>
            Operations platform — Phase 2 build in progress.
          </p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}
