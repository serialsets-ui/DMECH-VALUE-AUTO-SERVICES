import { Disc } from "lucide-react";

// Renders inside <main className="ops-main"> (the Sidebar stays put) while
// a route segment's data-fetch is in flight on a client-side navigation —
// separate from the OpsShell splash, which only plays on a full page load.
export default function OpsLoading() {
  return (
    <div className="ops-route-loading">
      <Disc size={38} strokeWidth={1.5} className="ops-route-loading-wheel" />
      <div className="ops-route-loading-label">Loading</div>
    </div>
  );
}
