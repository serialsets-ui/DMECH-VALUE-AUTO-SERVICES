import type { MetadataRoute } from "next";

// Keeps every staff- and customer-authenticated section out of search
// results. This is a discoverability hardening, not the actual access
// control — middleware + per-layout guards already block unauthenticated
// requests regardless of what a crawler does — but a well-behaved crawler
// honoring this never even requests these paths, so nothing about "DMECH
// has an internal ops portal at this URL" ends up indexed anywhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/ops",
        "/login",
        "/change-password",
        "/mfa",
        "/auth",
        "/register",
        "/verify",
        "/dashboard",
        "/documents",
        "/payments",
      ],
    },
  };
}
