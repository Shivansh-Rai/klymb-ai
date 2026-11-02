"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS, WELCOME } from "@/data/system-design/course-app";
import { answerQuickCheck, closeQuickCheck, commit, fmt, lessonDay, localDate, openLesson, quickCheckAt, quickCheckOf, streak, type CourseState } from "@/lib/course-app";
import { Icon } from "./icons";
import { track } from "./track";
import { GoogleButton, firstName, useCourseUser } from "./user";
import type { Act } from "./useCourseApp";

/* Overlays sit above the site-wide help launcher (z-60). */

export function Splash({ act }: { act: Act }) {
  return (
    <button
      type="button"
      onClick={() => act((p) => ({ ...p, screen: "onboard", onb: 0 }))}
      aria-label="Klymb.ai System Design. Tap to continue"
      className="fixed inset-0 z-[70] flex cursor-pointer flex-col justify-between bg-sd-accent px-6 pt-[72px] pb-12 text-left text-sd-bg active:scale-100! lg:p-12"
    >
      <span className="sd-a-in text-sm font-extrabold tracking-[0.1em] uppercase">Klymb.ai</span>
      <span className="sd-a-in text-[68px] leading-[0.88] font-extrabold tracking-[-0.05em] lg:text-[128px]" style={{ animationDuration: ".6s", animationDelay: "150ms" }}>System<br />Design</span>
      <span className="block h-[3px] w-full bg-white/30"><span className="block h-full origin-left bg-sd-bg" style={{ animation: "sd-grow 1.8s linear both" }} /></span>
    </button>
  );
}

const OVERVIEW = "/videos/system-design/overview-21day";

/** The course overview, free for everyone. The poster plays it on tap, then native controls take over. Its captions are burned in. */
export function OverviewVideo() {
  const seen = useRef(new Set<number>());
  const [started, setStarted] = useState(false);
  const onTime = (v: HTMLVideoElement) => {
    if (!v.duration) return;
    const pct = Math.min(100, Math.floor((v.currentTime / v.duration) * 4) * 25);
    if (pct > 0 && !seen.current.has(pct)) { seen.current.add(pct); track("video_progress", "overview", null, { pct }); }
  };
  return (
    <figure className="sd-a-side m-0 flex flex-col gap-2" style={{ animationDuration: ".5s", animationDelay: "80ms" }}>
      {started ? (
        <video
          controls
          autoPlay
          playsInline
          preload="none"
          poster={`${OVERVIEW}-poster.jpg`}
          controlsList="nodownload"
          onPlay={() => track("video_play", "overview")}
          onTimeUpdate={(e) => onTime(e.currentTarget)}
          className="aspect-video w-full rounded-xl border-2 border-sd-ink bg-black"
        >
          <source src="/api/video/overview-21day.mp4" type="video/mp4" />
        </video>
      ) : (
        <button type="button" onClick={() => { setStarted(true); track("video_play", "overview"); }} aria-label="Play the course overview" className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border-2 border-sd-ink bg-black">
          <Image src={`${OVERVIEW}-poster.jpg`} alt="Course overview video" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-[60px] items-center justify-center rounded-xl bg-sd-accent-400 text-sd-ink shadow-[0_8px_24px_rgba(0,0,0,.35)]"><Icon name="play" size={26} /></span>
          </span>
          <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 py-2 text-xs font-semibold text-white">
            <span>0:00 / 2:26</span>
            <span className="h-[3px] flex-1 rounded-full bg-white/35" />
          </span>
        </button>
      )}
      <figcaption className="text-xs text-sd-n-700">Course overview · 2:26 · Hinglish, captions on screen</figcaption>
    </figure>
  );
}

/** Signed out: Google first (it saves progress to your name), Day 1 without signing in as the quiet option. Signed in: straight to Day 1. */
function StartButtons({ user, startDay0 }: { user: boolean; startDay0: () => void }) {
  const link = "cursor-pointer self-start border-0 bg-transparent px-0 py-1.5 text-sm font-semibold text-sd-n-700 underline underline-offset-4 hover:text-sd-ink";
  if (user) {
    return (
      <button type="button" onClick={startDay0} className="sd-btn sd-btn-primary h-14 justify-between text-base">Start Day 1<Icon name="arrowR" /></button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <GoogleButton lesson="0-0" where="welcome" label="Continue with Google" className="h-14 border-2 border-sd-ink text-base" />
      <span className="text-xs text-sd-n-700">Saves your progress.</span>
      <button type="button" onClick={startDay0} className={link}>Go to Day 1</button>
    </div>
  );
}

/** The welcome: Kamran says hello, the page says what the course gives you, and one button starts Day 1. */
export function Onboarding({ act }: { s: CourseState; act: Act }) {
  const user = useCourseUser();
  const first = firstName(user);
  const done = (p: CourseState): CourseState => ({ ...p, onboarded: true });
  // The commitment comes first, once; then Day 1.
  const startDay0 = () => { track("welcome", null, null, { choice: "day0" }); act((p) => (p.commitment ? openLesson(done(p), "0-0") : { ...done(p), screen: "commit" })); };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-sd-bg px-5 pt-10 pb-8 lg:items-center lg:justify-center lg:p-10" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="flex w-full flex-col gap-6 lg:grid lg:max-w-[1080px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
        <div className="sd-a-side-b flex flex-col gap-5" style={{ animationDuration: ".5s" }}>
          <span className="sd-kicker text-sd-accent-700">System Design · 21 days</span>
          <div className="flex items-center gap-3">
            <Image src="/mascots/kamran-excited-v2.png" alt="Kamran, your study buddy" width={56} height={56} className="size-14 flex-none object-contain" />
            <p className="m-0 text-sm leading-[1.4] text-sd-n-800">Hi{first ? ` ${first}` : ""}, I’m Kamran. Watch the intro, then start Day 1.</p>
          </div>
          <h1 className="m-0 text-[38px] leading-[.95] tracking-[-0.045em] text-balance lg:text-[60px]">System design, phone pe.</h1>
          <p className="m-0 text-[15px] text-pretty text-sd-n-800 lg:text-[17px]">No system design experience needed. Day 1 starts from the basics.</p>
          <div className="hidden max-w-[360px] lg:block"><StartButtons user={!!user} startDay0={startDay0} /></div>
        </div>
        <OverviewVideo />
        <ol className="sd-a-in m-0 grid list-none grid-cols-1 gap-0 border-t-2 border-sd-ink p-0 md:grid-cols-3 md:gap-x-6 lg:col-span-2" style={{ animationDuration: ".5s", animationDelay: "160ms" }}>
          {WELCOME.map(([title, detail], i) => (
            <li key={title} className="grid grid-cols-[28px_1fr] gap-x-2 gap-y-0.5 border-b border-sd-divider py-3.5">
              <span className="text-[13px] leading-[1.5] font-extrabold text-sd-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base leading-[1.3] font-extrabold">{title}</span>
              <span className="col-start-2 text-[13px] leading-[1.4] text-sd-n-700">{detail}</span>
            </li>
          ))}
        </ol>
        <div className="sticky -bottom-8 -mx-5 border-t-2 border-sd-divider bg-sd-bg px-5 pt-3 pb-8 lg:hidden">
          <StartButtons user={!!user} startDay0={startDay0} />
        </div>
      </div>
    </div>
  );
}

/** The ungraded in-video question: a bottom sheet on mobile, a centred card on web. */
export function QuickCheckSheet({ s, act }: { s: CourseState; act: Act }) {
  const qc = quickCheckOf(s.cur)!;
  const picked = s.qcPick;
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-stretch justify-end bg-sd-n-900/50 lg:items-center lg:justify-center">
      <div role="dialog" aria-modal="true" aria-labelledby="sd-qc-q" className="sd-a-in sd-lg-shadow flex flex-col gap-3 rounded-t-2xl border-t-[3px] border-sd-accent bg-sd-bg px-5 lg:rounded-2xl pt-[18px] pb-[34px] lg:w-[min(540px,90%)] lg:p-6" style={{ animationDuration: ".35s" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-sd-accent-700 uppercase">Quick check · {fmt(quickCheckAt(s.cur))}</span>
          <span className="sd-tag sd-tag-neutral">Not graded</span>
        </div>
        <h3 id="sd-qc-q" className="m-0 text-xl leading-[1.2] tracking-[-0.015em] text-pretty lg:text-2xl">{qc.q}</h3>
        {qc.opts.map((o, i) => {
          const st = picked === null ? "idle" : i === qc.ans ? "ok" : picked === i ? "bad" : "dim";
          return (
            <button
              key={i}
              ref={i === 0 ? first : undefined}
              type="button"
              onClick={() => act((p) => answerQuickCheck(p, i))}
              aria-disabled={picked !== null}
              className={clsx(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-[11px] text-left text-[15px] transition-[background-color,opacity] duration-250",
                st === "ok" ? "border-sd-ink bg-sd-ink text-sd-bg" : st === "bad" ? "border-sd-accent bg-sd-accent-100" : "border-sd-divider",
                st === "dim" && "opacity-45",
              )}
            >
              <span className="flex size-[26px] flex-none items-center justify-center border-[1.5px] border-current text-xs font-extrabold">
                {st === "ok" ? <Icon name="check" size={14} stroke={3} /> : st === "bad" ? <Icon name="x" size={14} stroke={2.5} /> : String.fromCharCode(65 + i)}
              </span>
              <span>{o}</span>
            </button>
          );
        })}
        {picked !== null ? (
          <>
            <div className="sd-a-in flex flex-col gap-1.5 border-t-2 border-sd-divider pt-3" style={{ animationDuration: ".3s" }} aria-live="polite">
              <span className="text-base font-extrabold">{picked === qc.ans ? "Correct" : `Not quite. The answer is ${String.fromCharCode(65 + qc.ans)}.`}</span>
              <span className="text-sm leading-[1.45]">{qc.why}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => act((p) => closeQuickCheck(p, "rewatch"))} className="sd-btn sd-btn-secondary h-12 justify-start gap-1.5"><Icon name="rotL" size={16} />Rewatch 1 min</button>
              <button type="button" onClick={() => act((p) => closeQuickCheck(p, "continue"))} className="sd-btn sd-btn-primary h-12 flex-1 justify-between">Keep watching<Icon name="arrowR" /></button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => act((p) => closeQuickCheck(p, "skip"))} className="sd-btn sd-btn-ghost self-start">Skip for now</button>
        )}
      </div>
    </div>
  );
}

/** A lesson this viewer hasn't bought: what the full course gives, and the way to the offer. */
export function PaywallSheet({ s, act }: { s: CourseState; act: Act }) {
  const offer = useRef<HTMLAnchorElement>(null);
  useEffect(() => { offer.current?.focus(); }, []);
  const close = () => act((p) => ({ ...p, paywall: false }));
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-stretch justify-end bg-sd-n-900/50 lg:items-center lg:justify-center" onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="sd-pay-t" className="sd-a-in sd-lg-shadow flex flex-col gap-3 rounded-t-2xl border-t-[3px] border-sd-accent bg-sd-bg px-5 pt-[18px] pb-[34px] lg:w-[min(480px,90%)] lg:rounded-2xl lg:p-6" style={{ animationDuration: ".35s" }}>
        <span className="sd-kicker text-sd-accent-700">{lessonDay(s.cur)}</span>
        <h3 id="sd-pay-t" className="m-0 text-2xl leading-[1.15] tracking-[-0.02em] text-balance">This lesson is in the full course.</h3>
        <p className="m-0 text-[15px] leading-[1.45] text-pretty text-sd-n-800">The course intro is free. The full course opens every lesson, and you get 100% of your money back when you finish on schedule: one lesson a day, no missed days, 70% or higher on the final assessment.</p>
        <Link ref={offer} href="/system-design" className="sd-btn sd-btn-primary mt-1 h-[52px] justify-between text-base">See the offer<Icon name="arrowR" /></Link>
        <button type="button" onClick={close} className="sd-btn sd-btn-ghost self-start">Not now</button>
      </div>
    </div>
  );
}

/** Asked before throwing away a started assessment. "Keep going" is the main choice. */
export function LeaveQuizDialog({ s, act }: { s: CourseState; act: Act }) {
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => { stay.current?.focus(); }, []);
  return (
    <div className="sd-a-in fixed inset-0 z-[70] grid place-items-center bg-sd-n-900/50 p-4" style={{ animationDuration: ".2s" }} onKeyDown={(e) => { if (e.key === "Escape") act((p) => ({ ...p, confirmExit: false })); }}>
      <div className="sd-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sd-leave-t" aria-describedby="sd-leave-b">
        <div id="sd-leave-t" className="text-xl font-extrabold">Leave the assessment?</div>
        <div id="sd-leave-b" className="text-sm opacity-85">You’ve answered {Object.keys(s.quiz.answers).length} of {QUESTIONS.length}. If you leave now, these answers won’t be saved.</div>
        <div className="mt-2 flex justify-start gap-2">
          <button ref={stay} type="button" onClick={() => act((p) => ({ ...p, confirmExit: false }))} className="sd-btn sd-btn-primary">Keep going</button>
          <button type="button" onClick={() => act((p) => ({ ...p, screen: p.tab, confirmExit: false }))} className="sd-btn sd-btn-secondary">Leave</button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="sd-a-in sd-shadow-lg fixed top-3 right-3 left-3 z-[80] flex items-center gap-2.5 rounded-xl bg-sd-ink px-3.5 py-3 text-[13px] font-semibold text-sd-bg lg:top-5 lg:right-6 lg:left-auto lg:w-[380px]" style={{ animationDuration: ".35s" }}>
      <span className="flex text-sd-accent-400"><Icon name="check" size={16} /></span>{text}
    </div>
  );
}

const PLEDGES: { icon: "shield" | "flame"; title: string; body: string }[] = [
  { icon: "shield", title: "I’ll learn honestly", body: "No looking up answers. An honest score shows what to rewatch." },
  { icon: "flame", title: "I’ll do one lesson every day", body: "If I miss a day, I can keep learning, but my streak resets and I lose the refund." },
];
const HOLD_MS = 1200;

/** After the welcome: two promises, a signature, and a press-and-hold to make it official. Then Day 1. */
export function Commitment({ s, act }: { s: CourseState; act: Act }) {
  const user = useCourseUser();
  const [pledge, setPledge] = useState([false, false]);
  const [name, setName] = useState(user?.name ?? "");
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const done = !!s.commitment;
  const can = pledge.every(Boolean) && name.trim().length > 1;
  const down = () => {
    if (!can || done) return;
    window.clearTimeout(timer.current);
    setHolding(true);
    timer.current = window.setTimeout(() => { setHolding(false); act((p) => commit(p, name)); track("welcome", null, null, { choice: "commit" }); }, HOLD_MS);
  };
  const up = () => { window.clearTimeout(timer.current); setHolding(false); };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = () => act((p) => openLesson({ ...p, onboarded: true }, p.cur));
  const signed = s.commitment ? new Date(`${s.commitment.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="sd-a-screen fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-sd-bg px-5 pt-14 pb-7 lg:items-center lg:justify-center lg:p-10" role="dialog" aria-modal="true" aria-label="Make a commitment">
      <div className="flex w-full flex-1 flex-col gap-4 lg:max-w-[560px] lg:flex-none">
        {!done ? (
          <>
            <span className="sd-kicker text-sd-accent-700">Before you start</span>
            <h1 className="m-0 mb-1 text-[34px] leading-[.98] tracking-[-0.04em] text-balance lg:text-[52px]">Make two promises.</h1>
            <div className="flex flex-col gap-2.5" role="group" aria-label="Promises">
              {PLEDGES.map((pl, i) => {
                const on = pledge[i];
                return (
                  <button
                    key={pl.title}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setPledge((p) => p.map((x, k) => (k === i ? !x : x)))}
                    className={clsx("sd-a-in grid cursor-pointer grid-cols-[28px_1fr] items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-colors duration-200", on ? "border-sd-accent bg-sd-accent-100" : "border-sd-divider")}
                    style={{ animationDuration: ".45s", animationDelay: `${120 + i * 90}ms` }}
                  >
                    <span className={clsx("flex size-[26px] items-center justify-center rounded-[7px] border-2 text-sd-bg transition-colors duration-200", on ? "border-sd-accent bg-sd-accent" : "border-sd-n-400")}>{on && <Icon name="check" size={14} stroke={3.5} />}</span>
                    <span className="flex flex-col gap-[3px]">
                      <span className="flex items-center gap-1.5 text-base font-extrabold"><span className="flex text-sd-accent"><Icon name={pl.icon} size={18} /></span>{pl.title}</span>
                      <span className="text-[13px] leading-[1.45] text-sd-n-700">{pl.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold">Sign</span>
              <input className="sd-input min-h-12 text-lg font-bold" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
            </label>
            <div className="mt-auto flex flex-col gap-2 lg:mt-2">
              <button
                type="button"
                disabled={!can}
                onPointerDown={down}
                onPointerUp={up}
                onPointerLeave={up}
                onPointerCancel={up}
                onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); down(); } }}
                onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") up(); }}
                onContextMenu={(e) => e.preventDefault()}
                className="sd-btn sd-btn-primary sd-btn-block relative h-14 touch-none overflow-hidden text-base select-none"
              >
                <span className={clsx("absolute inset-y-0 left-0 bg-sd-accent-900", holding ? "w-full transition-[width] duration-[1200ms] ease-linear" : "w-0 transition-[width] duration-200 ease-out")} />
                <span className="relative flex items-center gap-2"><Icon name="check" />{holding ? "Keep holding…" : "Hold to commit"}</span>
              </button>
              <span className="text-xs text-sd-n-700">{can ? "Hold for a second." : "Tick both and sign."}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-1 flex-col justify-center gap-3.5 lg:flex-none">
              <span className="sd-a-pop flex size-[88px] items-center justify-center rounded-full bg-sd-accent text-sd-bg" style={{ animationDuration: ".55s" }}><Icon name="check" size={40} /></span>
              <h1 className="sd-a-in m-0 text-[34px] leading-[1.02] tracking-[-0.03em] lg:text-[52px]" style={{ animationDelay: "200ms" }}>You’re committed, {s.commitment!.name.split(" ")[0]}.</h1>
              <p className="sd-a-in m-0 text-[15px] text-pretty text-sd-n-800 lg:text-[17px]" style={{ animationDelay: "300ms" }}>Your streak starts with today’s lesson.</p>
              <div className="sd-a-in flex flex-col gap-0.5 rounded-xl border-2 border-dashed border-sd-divider px-3.5 py-3" style={{ animationDelay: "400ms" }}>
                <span className="text-xl font-extrabold italic">{s.commitment!.name}</span>
                <span className="text-xs text-sd-n-700">Signed {signed}</span>
              </div>
            </div>
            <button type="button" onClick={start} className="sd-a-in sd-btn sd-btn-primary sd-btn-block h-[52px] justify-between text-base" style={{ animationDelay: "500ms" }}>Start {lessonDay(s.cur)}<Icon name="arrowR" /></button>
          </>
        )}
      </div>
    </div>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** The first pass of the day: the flame, the new streak count, and today ticked in this week's row. */
export function StreakPop({ s, act }: { s: CourseState; act: Act }) {
  const close = () => act((p) => ({ ...p, streakPop: false }));
  const st = streak(s);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus(); }, []);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = WEEK.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDate(d);
    const today = key === localDate(now);
    return { label, today, past: !today && d < now && s.activeDays.includes(key), future: d > now && !today };
  });
  return (
    <div className="sd-a-fade fixed inset-0 z-[75] flex items-end justify-center bg-sd-ink/55 p-4 lg:items-center" onClick={close} onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <div role="dialog" aria-modal="true" aria-label="Streak updated" onClick={(e) => e.stopPropagation()} className="sd-a-sheet sd-shadow-lg flex w-full max-w-[400px] flex-col gap-4 rounded-2xl bg-sd-bg p-5">
        <div className="flex items-center gap-3.5">
          <div className="sd-a-flame-big flex size-14 flex-none items-center justify-center rounded-full bg-sd-accent text-sd-bg"><span className="sd-a-flicker flex"><Icon name="flame" size={30} /></span></div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold tracking-[0.1em] text-sd-accent-700 uppercase">Streak +1</span>
            <span className="text-[28px] leading-none font-extrabold tracking-[-0.02em]"><Roll n={st.current} delay={0.5} /> day streak</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  "flex size-[38px] items-center justify-center rounded-[10px] text-sd-bg",
                  d.today ? "sd-a-tickbox border-2 border-sd-accent bg-sd-accent" : d.past ? "sd-a-pop bg-sd-accent" : "sd-a-pop border-2 border-dashed border-sd-n-400",
                )}
                style={d.today ? undefined : { animationDuration: ".35s", animationDelay: `${250 + i * 60}ms` }}
              >
                {d.past ? <Icon name="check" size={16} stroke={3} /> : d.today ? <span className="sd-a-check flex"><Icon name="check" size={22} stroke={3.5} /></span> : null}
              </div>
              <span className={clsx("text-[11px]", d.today ? "font-extrabold text-sd-accent-700" : "font-semibold text-sd-n-700")}>{d.today ? "Today" : d.label}</span>
            </div>
          ))}
        </div>
        <button ref={btn} type="button" onClick={close} className="sd-a-rise sd-btn sd-btn-primary sd-btn-block h-12">Keep going</button>
      </div>
    </div>
  );
}

/** A number that rolls up from the one before it, like an odometer. */
export function Roll({ n, delay = 0.1 }: { n: number; delay?: number }) {
  return (
    <span className="inline-grid overflow-hidden align-top">
      <span className="sd-roll-out [grid-area:1/1]" style={{ animationDelay: `${delay}s` }} aria-hidden="true">{Math.max(0, n - 1)}</span>
      <span className="sd-roll-in [grid-area:1/1]" style={{ animationDelay: `${delay + 0.15}s` }}>{n}</span>
    </span>
  );
}

