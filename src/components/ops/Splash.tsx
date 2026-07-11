"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

// Matches the real top-level ops modules (sidebar groups), not the
// original mockup's slightly generic splash list — Parts and Shipments are
// genuinely distinct modules from Instalments/Logistics, so this reads
// more accurately as "what's actually loading."
const MODULES = [
  { icon: "🚗", label: "Vehicles" },
  { icon: "🔧", label: "Parts" },
  { icon: "⚙️", label: "Workshop" },
  { icon: "🚢", label: "Shipments" },
  { icon: "👥", label: "Customers" },
  { icon: "📊", label: "Reports" },
];

const STATUS_MESSAGES = [
  "Loading vehicle pipeline...",
  "Checking parts inventory...",
  "Connecting workshop modules...",
  "Tracking active shipments...",
  "Loading customer data...",
  "Preparing reports...",
];

interface SplashProps {
  onEnter: () => void;
}

// Module icons light up in sequence with a cycling status message, then
// auto-advances into the dashboard once "Platform ready" shows — no click
// required. Timings: 1600ms start delay, 420ms per module, a 700ms pause on
// "Platform ready" before the fade-out begins.
export function Splash({ onEnter }: SplashProps) {
  const [litCount, setLitCount] = useState(0);
  const [status, setStatus] = useState("Initializing systems...");
  const [ready, setReady] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const lightNext = () => {
      if (step < MODULES.length) {
        setLitCount(step + 1);
        setStatus(STATUS_MESSAGES[step]);
        step++;
        timer = setTimeout(lightNext, 420);
      } else {
        setReady(true);
        setStatus("Platform ready");
        timer = setTimeout(() => {
          setHiding(true);
          setTimeout(onEnter, 600);
        }, 700);
      }
    };

    const start = setTimeout(lightNext, 1600);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, [onEnter]);

  return (
    <div className={`splash ${hiding ? "hide" : ""}`}>
      <div className="splash-wrap">
        <div className="splash-ring" />
        <div className="splash-ring" />
        <div className="splash-logo">
          <Logo variant="splash" />
        </div>
        <div className="splash-tag">Operations Platform</div>
        <div className="splash-mods">
          {MODULES.map((m, i) => (
            <div className={`splash-mod ${i < litCount ? "lit" : ""}`} key={m.label}>
              <div className="smi">{m.icon}</div>
              <div className="sml">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="splash-bar-wrap">
          <div className="splash-bar" />
        </div>
        <div
          className="splash-status"
          style={ready ? { color: "var(--green)", fontWeight: 600 } : undefined}
        >
          {status}
        </div>
      </div>
      <div className="splash-ft">
        <div className="splash-ft-l">Powered by</div>
        <div className="splash-ft-b">SERIALSETS LIMITED</div>
      </div>
    </div>
  );
}
