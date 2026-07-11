// Text wordmark placeholder — the mockups embed a large base64 PNG logo
// inline (flagged in review as page-weight bloat that should become a real
// static asset). Rather than hand-transcribing that image data, this is a
// CSS-only stand-in; drop a real logo file at public/logo.png (or .svg) and
// swap this for an <Image> when one's available.
//
// Stacked so the full company name ("DMECH Value Auto Services") is
// actually represented, not truncated to "DMECH Value" — the primary mark
// stays compact for the nav bar, "Auto Services" rides underneath as a
// small caption.
export function Logo({ variant = "nav" }: { variant?: "nav" | "footer" }) {
  const className = variant === "nav" ? "nav-logo" : "footer-logo";
  return (
    <span className={className}>
      <span className="logo-primary">
        DMECH <span>Value</span>
      </span>
      <span className="logo-sub">Auto Services</span>
    </span>
  );
}
