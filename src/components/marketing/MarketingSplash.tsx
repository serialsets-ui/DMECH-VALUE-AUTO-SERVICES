"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const PHOTOS = [
  "/splash/01_cars_road.jpg",
  "/splash/02_cargo_port.jpg",
  "/splash/03-car-lot.jpg",
  "/splash/04-workshop.jpg",
  "/splash/05-ev-charging.jpg",
  "/splash/06-car-transport.jpg",
];

interface MarketingSplashProps {
  onEnter: () => void;
}

// Full-bleed backdrop of six real vehicle/shipping/workshop photos,
// crossfading via CSS (no JS timer driving the rotation — just staggered
// animation-delays on stacked layers). Auto-dismisses after a brief pause;
// unlike the ops splash this can't gate on a click — a public marketing
// site loses visitors to every extra second before real content shows.
//
// Duration is deliberately long enough to see 2-3 photo transitions and
// the progress bar fill — the original 2.2s (against a 12s crossfade
// cycle) was too short to read as anything more than a flash before it
// vanished.
export function MarketingSplash({ onEnter }: MarketingSplashProps) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const dismiss = setTimeout(() => {
      setHiding(true);
      setTimeout(onEnter, 600);
    }, 3400);
    return () => clearTimeout(dismiss);
  }, [onEnter]);

  return (
    <div className={`msplash ${hiding ? "hide" : ""}`}>
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
