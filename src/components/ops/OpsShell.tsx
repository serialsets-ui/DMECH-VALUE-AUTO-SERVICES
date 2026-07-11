"use client";

import { useEffect, useState } from "react";
import { Splash } from "@/components/ops/Splash";

const SESSION_KEY = "dmech-ops-splash-shown";

// Gates the splash to once per browser session (sessionStorage) rather than
// replaying on every navigation between /ops pages — the original mockup
// was a single static page, so it only ever ran once naturally; real
// routing here means we have to be explicit about that.
//
// Server and initial client render both show no splash (sessionStorage
// isn't available during SSR) — the useEffect below flips it on right
// after mount if this is a fresh session, which avoids a hydration
// mismatch at the cost of one frame's flash, an acceptable trade here.
export function OpsShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // sessionStorage is browser-only and unavailable during SSR, so this
    // one-time check genuinely can't move to an event handler or a lazy
    // useState initializer without causing a hydration mismatch.
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSplash(true);
    }
  }, []);

  function handleEnter() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setShowSplash(false);
  }

  return (
    <>
      {showSplash && <Splash onEnter={handleEnter} />}
      {children}
    </>
  );
}
