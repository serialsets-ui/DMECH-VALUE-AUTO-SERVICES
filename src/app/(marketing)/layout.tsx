import "@/styles/marketing.css";
import { Nav } from "@/components/marketing/Nav";
import { Ticker } from "@/components/marketing/Ticker";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <Ticker />
      {children}
      <Footer />
    </>
  );
}
