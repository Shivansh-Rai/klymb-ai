import { HIDE_MONEY } from "@/lib/site-status";
import { AiFoundations } from "@/components/home/AiFoundations";
import { ForYouIf } from "@/components/home/ForYouIf";
import { LazyHowItWorks, LazyPromoFilm } from "@/components/lazy/LazyHome";
import { CareerTracks } from "@/components/home/CareerTracks";
import { Evidence } from "@/components/home/Evidence";
import { FaqJoin } from "@/components/home/FaqJoin";
import { StickyEnrolBar } from "@/components/home/StickyEnrolBar";
import { SystemDesignFeature } from "@/components/home/SystemDesignFeature";
import { WhyRefund } from "@/components/home/WhyRefund";
import { allFree } from "@/data/tracks";
import { Hero } from "@/components/home/Hero";
import { ExpertsStrip } from "@/components/home/ExpertsStrip";
import { HowItWorksStatic } from "@/components/home/HowItWorksStatic";
import { Pricing } from "@/components/home/Pricing";
import { TwoWays } from "@/components/home/TwoWays";
import { StatementBand } from "@/components/home/StatementBand";
import { redirect } from "next/navigation";
import { statement } from "@/data/program";
import { getLearnerState } from "@/lib/learner/data";

export default async function HomePage() {
  // A signed-in learner wants their cohort, not the sales page.
  const learner = await getLearnerState();
  if (learner.state === "enrolled") redirect("/learn");

  return (
    <>
      <Hero />
      <SystemDesignFeature />
      <ExpertsStrip className="border-y border-line/30 bg-white py-8 sm:py-9" />
      <StatementBand>{statement}</StatementBand>
      <LazyPromoFilm />
      <ForYouIf />
      <AiFoundations />
      <Evidence />
      <LazyHowItWorks fallback={<HowItWorksStatic />} />
      <CareerTracks />
      <TwoWays />
      {!HIDE_MONEY && <Pricing />}
      {!allFree && <WhyRefund />}
      <FaqJoin />
      <StickyEnrolBar />
    </>
  );
}
