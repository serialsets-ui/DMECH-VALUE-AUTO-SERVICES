"use client";

import { useState } from "react";
import { Splash } from "@/components/ops/Splash";

// Plays on every fresh mount of the ops layout — after login and on every
// browser refresh — rather than once per session. `useState(true)` is a
// static default (same on server and client), so there's no hydration
// mismatch to work around here, unlike the sessionStorage-gated version
// this replaced.
export function OpsShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <Splash onEnter={() => setShowSplash(false)} />}
      {children}
    </>
  );
}
