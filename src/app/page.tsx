import { MarketingHeader } from "@/components/layout/marketing-header";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ReportPreview } from "@/components/marketing/report-preview";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { ConversionFooter } from "@/components/marketing/conversion-footer";

export default function Home() {
  return (
    <div className="relative pb-20">
      <MarketingHeader />
      <main className="mx-auto mt-28 flex w-full max-w-6xl flex-col gap-20 px-6">
        <Hero />
        <HowItWorks />
        <ReportPreview />
        <Pricing />
        <FAQ />
        <ConversionFooter />
      </main>
      <footer className="mt-16 border-t border-white/5 py-10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} OneMinuteCloser Weekly. Built for ambitious students.
      </footer>
    </div>
  );
}
