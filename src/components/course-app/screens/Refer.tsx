"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SD_REFERRAL, type ReferralMiss } from "@/lib/sd-offer";
import { ReferralCard, ReferralSteps, buyerSteps, useReferralStanding } from "../Referral";
import { ScreenTitle } from "../ui";
import { GoogleButton } from "../user";

const STEPS = [
  "Buy the course. You get your own link and code.",
  `${SD_REFERRAL.friends} friends buy with your link within ${SD_REFERRAL.days} days of your purchase.`,
  "We refund 100% of what you paid. You keep the course.",
];

const toOffer = <Link href="/system-design" className="sd-btn sd-btn-primary h-11 w-fit">See the offer</Link>;

/** Why there's no link here, and what to do about it. */
const MISS: Record<ReferralMiss, { title: string; body: string; action: ReactNode }> = {
  signin: { title: "Sign in to see your link.", body: "Sign in with the Google account you paid with.", action: <GoogleButton where="refer" className="h-11 border-2 border-sd-ink sm:max-w-[320px]" /> },
  buy: { title: "Your course can be free.", body: "Referral links are for people who have bought the course.", action: toOffer },
  granted: { title: "No referral link on this seat.", body: "This seat was given to you free, so there’s no fee to refund and no referral link.", action: null },
  retry: { title: "We couldn’t load this.", body: "Refresh to try again.", action: <button type="button" onClick={() => window.location.reload()} className="sd-btn sd-btn-secondary h-11 w-fit">Refresh</button> },
};

/** The referral offer's own screen, for everyone: a buyer's link and progress, or why there isn't one. */
export function Refer() {
  const { view, why } = useReferralStanding();
  const miss = why && MISS[why];
  return (
    <div className="sd-a-screen flex max-w-[640px] flex-col gap-[18px] px-5 pt-2 pb-7 lg:p-0">
      <ScreenTitle>Refer friends</ScreenTitle>
      {view && <ReferralCard r={view} />}
      {miss && (
        <section className="flex flex-col gap-2.5">
          <h3 className="m-0 text-2xl leading-[1.15] tracking-[-0.02em] text-balance">{miss.title}</h3>
          <p className="m-0 text-[15px] leading-[1.4] text-pretty text-sd-n-800">{miss.body}</p>
          {miss.action}
        </section>
      )}
      <section aria-label="How it works" className="flex flex-col gap-2.5">
        <h6 className="sd-h6 m-0">How it works</h6>
        <ReferralSteps steps={view?.state === "open" ? buyerSteps(view) : STEPS} />
        <p className="m-0 text-xs leading-[1.4] text-sd-n-700">A friend who has lost your link can type your code into the form when they buy. <Link href="/refund-policy" className="underline underline-offset-2">T&amp;C apply.</Link></p>
      </section>
    </div>
  );
}
