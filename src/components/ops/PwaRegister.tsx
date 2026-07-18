"use client";

import { useEffect } from "react";

// Registers public/ops-sw.js scoped to /ops/ only -- the marketing site and
// customer portal aren't part of this PWA and shouldn't pick up a cached
// shell meant for the staff app.
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/ops-sw.js", { scope: "/ops/" }).catch(() => {});
    }
  }, []);

  return null;
}
