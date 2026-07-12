"use client";

import { useEffect, useState } from "react";
import { MarketingSplash } from "@/components/marketing/MarketingSplash";

const SESSION_KEY = "dmech-marketing-splash-shown";

// Shows once per browser session, not on every page — unlike the ops
// splash (which replays on every login/refresh), a public marketing site
// can't afford to slow down repeat navigation between pages for the same
// visitor.
export function MarketingShell({ children }: { children: React.ReactNode }) {
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
      {showSplash && <MarketingSplash onEnter={handleEnter} />}
      {children}
    </>
  );
}
