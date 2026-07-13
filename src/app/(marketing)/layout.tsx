import "@/styles/marketing.css";
import { Nav } from "@/components/marketing/Nav";
import { Ticker } from "@/components/marketing/Ticker";
import { Footer } from "@/components/marketing/Footer";
import { MarketingSplash } from "@/components/marketing/MarketingSplash";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingSplash />
      <Nav />
      <Ticker />
      {children}
      <Footer />
    </>
  );
}
