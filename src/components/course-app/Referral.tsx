"use client";

import clsx from "clsx";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SD_REFERRAL, type ReferralView } from "@/lib/sd-offer";
import type { Act } from "./useCourseApp";

/** A buyer's referral offer: read on the server and handed to the course. Null for anyone without a paid seat. */
const Ctx = createContext<ReferralView | null>(null);
export const ReferralProvider = Ctx.Provider;
export const useReferral = () => useContext(Ctx);

const whatsapp = (link: string) => `https://wa.me/?text=${encodeURIComponent(`I'm learning System Design on Klymb.ai, in 15 minutes a day. Join with my link: ${link}`)}`;

/** Their link, with the two ways of sending it. */
function ShareLink({ r }: { r: ReferralView }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(r.link).then(() => setCopied(true)); };
  return (
    <div className="flex flex-col gap-2">
      <span className="truncate rounded-lg border border-sd-divider px-3 py-2 text-[13px] font-semibold">{r.link.replace(/^https:\/\/(www\.)?/, "")}</span>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={copy} className="sd-btn sd-btn-secondary h-11">{copied ? "Copied" : "Copy link"}</button>
        <a href={whatsapp(r.link)} target="_blank" rel="noopener noreferrer" className="sd-btn sd-btn-primary h-11">WhatsApp</a>
      </div>
    </div>
  );
}

/** One line for where they stand. The count is all they see: never who bought. */
function headline(r: ReferralView) {
  switch (r.state) {
    case "open": return `${r.count} of ${SD_REFERRAL.friends} friends · ${r.left.replaceAll(" ", " ")} · ${r.amount} back`;
    case "earned": return `You’ve earned your ${r.amount} back.`;
    case "refunded": return `${r.amount} refunded. The course is yours.`;
    case "closed": return `Your ${SD_REFERRAL.days} days ended with ${r.count} of ${SD_REFERRAL.friends} friends.`;
  }
}

function detail(r: ReferralView) {
  switch (r.state) {
    case "open": return `Get ${SD_REFERRAL.friends} friends to buy with your link by ${r.ends} and we refund 100% of what you paid. You keep the course.`;
    case "earned": return "It reaches your original payment method within 14 working days. You keep the course.";
    case "refunded": return null;
    case "closed": return "You can still get your fee back by finishing the course.";
  }
}

/** The lasting card on Home and Profile. */
export function ReferralCard({ r, className }: { r: ReferralView; className?: string }) {
  const body = detail(r);
  return (
    <section aria-label="Get your fee back" className={clsx("flex flex-col gap-3 rounded-xl border-2 border-sd-divider p-4", className)}>
      <span className="sd-kicker text-sd-accent-700">Get your fee back</span>
      <span className="text-lg leading-[1.2] font-extrabold tracking-[-0.01em] text-balance">{headline(r)}</span>
      {r.state === "open" && (
        <div role="img" aria-label={`${r.count} of ${SD_REFERRAL.friends} friends`} className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: SD_REFERRAL.friends }, (_, i) => <span key={i} className={clsx("h-1.5 rounded-full", i < r.count ? "bg-sd-accent" : "bg-sd-divider")} />)}
        </div>
      )}
      {body && <p className="m-0 text-sm leading-[1.4] text-pretty text-sd-n-800">{body} <Link href="/refund-policy" className="underline underline-offset-2">T&amp;C apply.</Link></p>}
      {r.state === "open" && <ShareLink r={r} />}
    </section>
  );
}

/** Shown once, on the first tab screen after buying, so nobody who joins misses the offer. */
export function ReferralSheet({ r, act }: { r: ReferralView; act: Act }) {
  const later = useRef<HTMLButtonElement>(null);
  useEffect(() => { later.current?.focus(); }, []);
  const close = () => act((p) => ({ ...p, referralSeen: true }));
  const steps = ["Share your link with friends.", `${SD_REFERRAL.friends} of them buy by ${r.ends}.`, `We refund your ${r.amount}. You keep the course.`];
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-stretch justify-end bg-sd-n-900/50 lg:items-center lg:justify-center" onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="sd-ref-t" className="sd-a-in sd-lg-shadow flex flex-col gap-3 rounded-t-2xl border-t-[3px] border-sd-accent bg-sd-bg px-5 pt-[18px] pb-[34px] lg:w-[min(480px,90%)] lg:rounded-2xl lg:p-6" style={{ animationDuration: ".35s" }}>
        <span className="sd-kicker text-sd-accent-700">Refer {SD_REFERRAL.friends} friends</span>
        <h3 id="sd-ref-t" className="m-0 text-2xl leading-[1.15] tracking-[-0.02em] text-balance">Your course can be free.</h3>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {steps.map((step, i) => (
            <li key={step} className="flex items-baseline gap-2.5 text-[15px] leading-[1.4] text-sd-n-800">
              <span className="text-[13px] font-extrabold text-sd-accent">{i + 1}</span>{step}
            </li>
          ))}
        </ol>
        <ShareLink r={r} />
        <p className="m-0 text-xs leading-[1.4] text-sd-n-700">You can find this any time on Home and Profile. <Link href="/refund-policy" className="underline underline-offset-2">T&amp;C apply.</Link></p>
        <button ref={later} type="button" onClick={close} className="sd-btn sd-btn-ghost self-start">Maybe later</button>
      </div>
    </div>
  );
}
