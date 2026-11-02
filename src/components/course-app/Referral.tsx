"use client";

import clsx from "clsx";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SD_REFERRAL, type ReferralStanding, type ReferralView } from "@/lib/sd-offer";
import { Icon } from "./icons";
import { track } from "./track";
import type { Act } from "./useCourseApp";

/** Where a viewer stands on the referral offer: read on the server and handed to the course. */
const Ctx = createContext<ReferralStanding>({ view: null, why: "retry" });
export const ReferralProvider = Ctx.Provider;
export const useReferralStanding = () => useContext(Ctx);
/** A buyer's offer. Null for anyone without a paid seat. */
export const useReferral = () => useContext(Ctx).view;

/** What `?start=refer` shows, for checking the screen from a seat that has no offer. */
export const SAMPLE_REFERRAL: ReferralStanding = {
  why: null,
  view: { code: "ABCD2345", link: "https://www.klymb.ai/system-design?ref=ABCD2345", count: 1, state: "open", left: "7 days left", ends: "12 Nov, 9:30 pm", amount: "₹499", sample: true },
};

const invite = "I'm learning System Design on Klymb.ai, in 15 minutes a day. Join with my link:";
const whatsapp = (link: string) => `https://wa.me/?text=${encodeURIComponent(`${invite} ${link}`)}`;

/** One thing to copy, with what it's for. If the clipboard is blocked, it's left selected to copy by hand. */
function CopyRow({ label, value, shown = value, disabled }: { label: string; value: string; shown?: string; disabled?: boolean }) {
  const text = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"" | "copied" | "failed">("");
  const run = async () => {
    try {
      await navigator.clipboard.writeText(value);
      track("share", null, "done", { kind: `referral_${label.toLowerCase()}` });
      setState("copied");
      window.setTimeout(() => setState(""), 2000);
    } catch {
      if (text.current) window.getSelection()?.selectAllChildren(text.current);
      setState("failed");
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="sd-kicker text-sd-n-700">{label}</span>
      <div className="flex items-center gap-2">
        <span ref={text} className="min-w-0 flex-1 rounded-lg border border-sd-divider px-3 py-2.5 text-[13px] leading-[1.3] font-semibold break-all select-all">{shown}</span>
        <button type="button" onClick={run} disabled={disabled} aria-label={`Copy ${label.toLowerCase()}`} className="sd-btn sd-btn-secondary h-11 flex-none gap-1.5 px-3 disabled:opacity-50">
          <Icon name={state === "copied" ? "check" : "copy"} size={16} />{state === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <p role="status" className="m-0 text-xs text-sd-n-700 empty:hidden">{state === "failed" ? "Couldn't copy that. It's selected, so copy it by hand." : ""}</p>
    </div>
  );
}

/** Their link and code, with every way of sending them. */
export function ShareLink({ r }: { r: ReferralView }) {
  // The app only draws in the browser, so this can't differ from a server render.
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const share = async () => {
    try {
      await navigator.share({ title: "System Design on Klymb.ai", text: invite, url: r.link });
      track("share", null, "done", { kind: "referral_sheet" });
    } catch { /* they closed the sheet: the other buttons are still there */ }
  };
  return (
    <div className="flex flex-col gap-3">
      <CopyRow label="Link" value={r.link} shown={r.link.replace(/^https:\/\/(www\.)?/, "")} disabled={r.sample} />
      <div className={clsx("grid gap-2", canShare && "grid-cols-2")}>
        {canShare && <button type="button" onClick={share} disabled={r.sample} className="sd-btn sd-btn-primary h-11 gap-2 disabled:opacity-50"><Icon name="share" size={16} />Share</button>}
        {r.sample
          ? <span className="sd-btn sd-btn-secondary h-11 opacity-50">WhatsApp</span>
          : <a href={whatsapp(r.link)} target="_blank" rel="noopener noreferrer" onClick={() => track("share", null, "done", { kind: "referral_whatsapp" })} className={clsx("sd-btn h-11", canShare ? "sd-btn-secondary" : "sd-btn-primary")}>WhatsApp</a>}
      </div>
      <CopyRow label="Code" value={r.code} disabled={r.sample} />
      {r.sample && <p className="m-0 text-xs text-sd-n-700">Preview with made-up numbers. Buyers see their own link here.</p>}
    </div>
  );
}

/** One line for where they stand. The count is all they see: never who bought. */
export function headline(r: ReferralView) {
  switch (r.state) {
    case "open": return `${r.count} of ${SD_REFERRAL.friends} friends · ${r.left.replaceAll(" ", "\u00a0")} · ${r.amount} back`;
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

/** Where they stand on the Refer tab, with their link while it can still earn anything. */
export function ReferralCard({ r }: { r: ReferralView }) {
  const body = detail(r);
  return (
    <section aria-label="Get your fee back" className="flex flex-col gap-3 rounded-xl border-2 border-sd-divider p-4">
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

/** The way into the Refer tab from Home, above the lesson, while the offer is open. */
export function ReferralStrip({ r, act }: { r: ReferralView; act: Act }) {
  return (
    <button
      type="button"
      onClick={() => act((p) => ({ ...p, screen: "refer", tab: "refer" }))}
      className="sd-a-in flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border-2 border-sd-divider px-3 py-2 text-left text-[13px] leading-[1.25] font-extrabold hover:bg-sd-accent-100"
    >
      <span className="flex text-sd-accent"><Icon name="gift" size={18} /></span>
      <span className="min-w-0 flex-1">{headline(r)}</span>
      <span className="flex text-sd-n-600"><Icon name="chevR" size={16} /></span>
    </button>
  );
}

/** The three steps, numbered. */
export function ReferralSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {steps.map((step, i) => (
        <li key={step} className="flex items-baseline gap-2.5 text-[15px] leading-[1.4] text-sd-n-800">
          <span className="text-[13px] font-extrabold text-sd-accent">{i + 1}</span>{step}
        </li>
      ))}
    </ol>
  );
}

export const buyerSteps = (r: ReferralView) => ["Share your link with friends.", `${SD_REFERRAL.friends} of them buy by ${r.ends}.`, `We refund your ${r.amount}. You keep the course.`];

/** Shown once, on the first tab screen after buying, so nobody who joins misses the offer. */
export function ReferralSheet({ r, act }: { r: ReferralView; act: Act }) {
  const later = useRef<HTMLButtonElement>(null);
  useEffect(() => { later.current?.focus(); }, []);
  const close = () => act((p) => ({ ...p, referralSeen: true }));
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-stretch justify-end bg-sd-n-900/50 lg:items-center lg:justify-center" onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="sd-ref-t" className="sd-a-in sd-lg-shadow flex max-h-dvh flex-col gap-3 overflow-y-auto rounded-t-2xl border-t-[3px] border-sd-accent bg-sd-bg px-5 pt-[18px] pb-[34px] lg:w-[min(480px,90%)] lg:rounded-2xl lg:p-6" style={{ animationDuration: ".35s" }}>
        <span className="sd-kicker text-sd-accent-700">Refer {SD_REFERRAL.friends} friends</span>
        <h3 id="sd-ref-t" className="m-0 text-2xl leading-[1.15] tracking-[-0.02em] text-balance">Your course can be free.</h3>
        <ReferralSteps steps={buyerSteps(r)} />
        <ShareLink r={r} />
        <p className="m-0 text-xs leading-[1.4] text-sd-n-700">You can find this any time in the Refer tab. <Link href="/refund-policy" className="underline underline-offset-2">T&amp;C apply.</Link></p>
        <button ref={later} type="button" onClick={close} className="sd-btn sd-btn-ghost self-start">Maybe later</button>
      </div>
    </div>
  );
}
