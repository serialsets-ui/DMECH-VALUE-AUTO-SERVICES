"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const MODULES = [
  { icon: "🚗", label: "Vehicles" },
  { icon: "💰", label: "Instalments" },
  { icon: "⚙️", label: "Workshop" },
  { icon: "🚢", label: "Logistics" },
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

// Ported from the Operations Platform mockup's splash screen: module icons
// light up in sequence with a cycling status message, then an "Enter
// Platform" button appears (click or Enter key) which fades the splash out
// before handing off to the caller. Timings match the original (1600ms
// start delay, 420ms per module, 400ms before the button appears).
export function Splash({ onEnter }: SplashProps) {
  const [litCount, setLitCount] = useState(0);
  const [status, setStatus] = useState("Initializing systems...");
  const [ready, setReady] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
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
        timer = setTimeout(() => setShowEnter(true), 400);
      }
    };

    const start = setTimeout(lightNext, 1600);
    return () => {
      clearTimeout(start);
      clearTimeout(timer);
    };
  }, []);

  function handleEnter() {
    setHiding(true);
    setTimeout(onEnter, 600);
  }

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Enter" && showEnter) handleEnter();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEnter]);

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
        <div className={`splash-enter ${showEnter ? "show" : ""}`}>
          <button className="splash-enter-btn" onClick={handleEnter}>
            Enter Platform <span className="arrow">→</span>
          </button>
        </div>
      </div>
      <div className="splash-ft">
        <div className="splash-ft-l">Powered by</div>
        <div className="splash-ft-b">SERIALSETS LIMITED</div>
      </div>
    </div>
  );
}
