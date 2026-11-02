import Image from "next/image";
import Link from "next/link";
import { entity } from "@/data/legal";
import type { SdOfferState, SdRole } from "@/lib/sd-offer";
import { ClaimCard } from "./ClaimCard";
import { IntroVideo } from "./IntroVideo";
import { OfferBackdrop } from "./OfferBackdrop";

const STATS = [["21", "days"], ["15 min", "a day"], ["5", "days of AI design"]];

/** The System Design offer: the promise on the left, the price and the claim form on the right. */
export function OfferView({ offer, email, name, phone, linkedin, role, campaign, referral, resume, signInFailed, inApp }: {
  offer: SdOfferState; email: string | null; name: string; phone: string; linkedin: string; role: SdRole | ""; campaign: string | null;
  referral: { code: string; invitedBy: string } | null; resume: boolean; signInFailed: boolean; inApp: boolean;
}) {
  return (
    <OfferBackdrop>
      <main className="relative mx-auto box-border grid min-h-dvh w-full max-w-[1160px] grid-cols-[minmax(0,1fr)] items-center gap-[26px] px-[18px] pt-11 pb-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)] lg:gap-16 lg:px-12 lg:py-16">
        <div className="sd-offer-left flex flex-col gap-4 lg:gap-6">
          <div className="flex items-center justify-between gap-3">
            <Image src="/brand/klymb-logo.svg" alt="Klymb.ai" width={104} height={16} priority className="h-4 w-auto [filter:brightness(0)_invert(1)_sepia(.2)]" />
            {offer.discounted && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,162,74,.5)] bg-[rgba(201,162,74,.16)] px-3 py-1.5 text-[11px] font-extrabold tracking-[.1em] whitespace-nowrap text-[#e7c97a] uppercase">
                <span className="size-[7px] rounded-full bg-[#e7c97a] shadow-[0_0_10px_2px_rgba(231,201,122,.8)]" />Early Diwali offer
              </span>
            )}
          </div>
          <h1 className="m-0 text-[44px] leading-[.9] font-extrabold tracking-[-.055em] text-balance text-[#fbf6ee] lg:text-[clamp(56px,7.4cqw,92px)]">System design, <span className="text-[#f0868b]">phone pe.</span></h1>
          <p className="m-0 max-w-[30rem] text-[15px] leading-[1.45] text-pretty text-[#d9cfc2] lg:text-lg">System design, explained with real examples.<br />Built for interviews.</p>
          <dl className="m-0 hidden grid-cols-3 gap-4 border-t border-[rgba(246,239,228,.18)] pt-[18px] lg:grid">
            {STATS.map(([value, label]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dd className="order-1 m-0 text-[30px] leading-none font-extrabold tracking-[-.03em] text-[#fbf6ee]">{value}</dd>
                <dt className="order-2 text-[13px] text-[#b9ad9f]">{label}</dt>
              </div>
            ))}
          </dl>
          <IntroVideo />
        </div>

        <div className="sd-offer-right flex flex-col gap-4">
          <ClaimCard offer={offer} email={email} name={name} phone={phone} linkedin={linkedin} role={role} campaign={campaign} referral={referral} resume={resume} signInFailed={signInFailed} inApp={inApp} />
          <div className="flex flex-col gap-1.5 text-[13px] leading-[1.4] text-[#b9ad9f]">
            <a href="#course-intro" className="font-bold text-[#f3d48a] underline underline-offset-4">Not sure yet? Watch the 2-minute course intro, free</a>
            <p className="m-0 text-xs">
              Sold by {entity.registeredName} ·{" "}
              <Link href="/terms" className="underline underline-offset-2">Terms</Link> ·{" "}
              <Link href="/refund-policy" className="underline underline-offset-2">Refund policy</Link> ·{" "}
              <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
            </p>
          </div>
        </div>
      </main>
    </OfferBackdrop>
  );
}
