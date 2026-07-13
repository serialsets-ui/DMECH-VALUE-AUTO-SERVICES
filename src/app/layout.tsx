import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dmechvalueautoservices.netlify.app";
const OG_IMAGE = "/splash/01_cars_road.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DMECH Value Auto Services",
  description: "Import. Drive. Thrive.",
  openGraph: {
    title: "DMECH Value Auto Services",
    description: "Import. Drive. Thrive.",
    siteName: "DMECH Value Auto Services",
    url: SITE_URL,
    images: [{ url: OG_IMAGE, width: 1080, height: 720 }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DMECH Value Auto Services",
    description: "Import. Drive. Thrive.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
