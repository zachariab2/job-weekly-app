import { Pricing } from "@/components/marketing/pricing";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function PricingPage() {
  return (
    <div className="relative pb-20">
      <MarketingHeader />
      <main className="mx-auto mt-28 flex w-full max-w-6xl flex-col gap-12 px-6">
        <Pricing />
      </main>
    </div>
  );
}
