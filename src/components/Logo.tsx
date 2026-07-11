// Text wordmark placeholder — the real logo (mark + "DMECH value services"
// wordmark) hasn't landed in the repo as a static asset yet. This is a
// CSS-only stand-in; once the file's in public/, swap this for a real
// <Image> — every call site (nav, footer, ops splash) goes through this one
// component, so that's a one-file change when it happens.
//
// Stacked so the full company name ("DMECH Value Auto Services") is
// actually represented, not truncated to "DMECH Value" — the primary mark
// stays compact for the nav bar, "Auto Services" rides underneath as a
// small caption. "splash" is a larger, centered variant for the Ops
// Platform's loading screen (dark background, so it reuses the
// light-on-dark treatment from the footer variant rather than nav's
// dark-on-light one).
export function Logo({ variant = "nav" }: { variant?: "nav" | "footer" | "splash" }) {
  const className =
    variant === "nav" ? "nav-logo" : variant === "footer" ? "footer-logo" : "logo-splash";
  return (
    <span className={className}>
      <span className="logo-primary">
        DMECH <span>Value</span>
      </span>
      <span className="logo-sub">Auto Services</span>
    </span>
  );
}
