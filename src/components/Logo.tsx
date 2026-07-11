import Image from "next/image";

// Real logo asset (public/logo.png), cropped tight to content and made
// transparent so it sits cleanly on both light (nav) and dark
// (footer/splash) backgrounds. Original file was a 1080x1080 JPEG with a
// large baked-in white canvas — cropped to its actual 718x190 content
// bounding box and had its white background converted to alpha via Pillow.
const ASPECT_RATIO = 718 / 190;

const HEIGHT: Record<"nav" | "footer" | "splash", number> = {
  nav: 30,
  footer: 32,
  splash: 64,
};

export function Logo({ variant = "nav" }: { variant?: "nav" | "footer" | "splash" }) {
  const height = HEIGHT[variant];
  const width = Math.round(height * ASPECT_RATIO);
  return (
    <Image
      src="/logo.png"
      alt="DMECH Value Services"
      width={width}
      height={height}
      style={{ height, width: "auto" }}
      priority={variant === "nav"}
    />
  );
}
