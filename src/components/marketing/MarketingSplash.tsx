import { Logo } from "@/components/Logo";

const PHOTOS = [
  "/splash/01_cars_road.jpg",
  "/splash/02_cargo_port.jpg",
  "/splash/03-car-lot.jpg",
  "/splash/04-workshop.jpg",
  "/splash/05-ev-charging.jpg",
  "/splash/06-car-transport.jpg",
];

// Full-bleed backdrop of six real vehicle/shipping/workshop photos,
// crossfading via CSS. Rendered unconditionally in the server HTML (no
// client state gating it) and hidden entirely by its own CSS animation
// after ~3.4s — a JS-driven "show after hydration" version of this let the
// real page content paint first on content-heavy pages before the splash
// caught up, which is backwards. See the blocking script in
// (marketing)/layout.tsx for the once-per-session skip logic, which runs
// before first paint for the same reason.
export function MarketingSplash() {
  return (
    <div className="msplash">
      <div className="msplash-photos">
        {PHOTOS.map((src) => (
          <div key={src} className="msplash-photo" style={{ backgroundImage: `url(${src})` }} />
        ))}
      </div>
      <div className="msplash-scrim" />
      <div className="msplash-content">
        <Logo variant="splash" />
        <div className="msplash-tagline">Import. Drive. Thrive.</div>
        <div className="msplash-bar-wrap">
          <div className="msplash-bar" />
        </div>
      </div>
    </div>
  );
}
