// Text wordmark placeholder — the mockups embed a large base64 PNG logo
// inline (flagged in review as page-weight bloat that should become a real
// static asset). Rather than hand-transcribing that image data, this is a
// CSS-only stand-in; drop a real logo file at public/logo.png (or .svg) and
// swap this for an <Image> when one's available.
export function Logo({ variant = "nav" }: { variant?: "nav" | "footer" }) {
  const className = variant === "nav" ? "nav-logo" : "footer-logo";
  return (
    <span className={className}>
      DMECH<span> Value</span>
    </span>
  );
}
