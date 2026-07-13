import { Car } from "lucide-react";

// Next.js App Router shows this automatically while a route segment's
// Server Component data-fetch is in flight on a client-side navigation —
// separate from MarketingSplash, which only plays on a full page load.
export default function MarketingLoading() {
  return (
    <div className="route-loading">
      <div className="route-loading-track">
        <div className="route-loading-road" />
        <div className="route-loading-car">
          <Car size={30} strokeWidth={1.75} />
        </div>
      </div>
      <div className="route-loading-label">Loading</div>
    </div>
  );
}
