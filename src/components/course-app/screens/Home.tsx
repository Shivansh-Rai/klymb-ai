"use client";

import clsx from "clsx";
import Image from "next/image";
import { ALL_IDS, LESSON_COUNT, PASS_MARK, checkAverage, dayOf, fmt, isSoon, lesson, lessonDay, localDate, nextStep, openFinal, openLesson, pct, streak, type CourseState } from "@/lib/course-app";
import { firstOpenLesson } from "./Course";
import { GoogleButton, firstName, useCourseUser } from "../user";
import { Icon } from "../icons";
import { OverviewVideo } from "../Overlays";
import { ReferralCard, useReferral } from "../Referral";
import { Bar, parallax, stagger } from "../ui";
import type { Act } from "../useCourseApp";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** This week, Monday first: which days had a finished step, and which one is today. */
function thisWeek(s: CourseState, now = new Date()) {
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return WEEK.map((l, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = localDate(d);
    return { l, done: s.activeDays.includes(key), today: key === localDate(now) };
  });
}

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function BellButton({ s, act, className }: { s: CourseState; act: Act; className?: string }) {
  const unread = s.notifs.filter((n) => n.unread).length;
  return (
    <button
      type="button"
      onClick={() => act((p) => ({ ...p, screen: "notifs", tab: "home" }))}
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      className={clsx("relative flex size-9 flex-none cursor-pointer items-center justify-center rounded-lg border border-sd-divider bg-transparent text-sd-ink hover:bg-sd-accent-100", className)}
    >
      <Icon name="bell" size={16} />
      {unread > 0 && <span className="absolute -top-[7px] -right-[7px] h-[18px] min-w-[18px] rounded-full bg-sd-accent px-1 text-left text-[10px] leading-[18px] font-extrabold text-sd-bg">{unread}</span>}
    </button>
  );
}

const STEP_NAME: Record<string, string> = { watch: "the video", reveal: "Learn", prove: "Prove it", estimate: "Estimate", build: "Build it", design: "Design it", follow: "the follow-ups", done: "the finish" };

/** Kamran's line on Home: one thing about where the learner is right now. */
function kamranSays(s: CourseState, first: string | null) {
  const name = lessonDay(s.cur);
  const hi = first ? `Hi ${first}! ` : "Welcome back! ";
  if (isSoon(s.cur)) return `All released days done. ${name} is coming soon.`;
  if (s.done.includes(s.cur)) {
    const after = ALL_IDS.find((id) => !s.done.includes(id));
    if (after) return isSoon(after) ? `All released days done. ${lessonDay(after)} is coming soon.` : `${hi}${lessonDay(after)} is next.`;
  }
  const p = s.lessons[s.cur];
  const day = dayOf(s.cur);
  if (!day) return `${hi}${name} is in the full course.`;
  if (!s.done.length && !p) return `Hi${first ? ` ${first}` : ""}, I’m Kamran. ${name} takes about ${day.minutes} minutes.`;
  if (!p) return `${hi}${name} takes about ${day.minutes} minutes.`;
  const next = nextStep(s, s.cur, day);
  return `${hi}Pick up at ${STEP_NAME[next]}.`;
}

export function Home({ s, act }: { s: CourseState; act: Act }) {
  const user = useCourseUser();
  const referral = useReferral();
  const c = lesson(s.cur);
  const postP = s.post ? pct(s.post) : null;
  const doneCount = s.done.length;
  const coursePct = `${Math.round((doneCount / LESSON_COUNT) * 100)}%`;
  const st = streak(s);
  const week = thisWeek(s);
  const hello = greeting();
  const path = [
    { num: "01", title: "Lessons", sub: "21 days", value: `${doneCount}/${LESSON_COUNT}`, go: () => act((p) => ({ ...p, screen: "course", tab: "course" })) },
    {
      num: "02", title: "Lesson checks", sub: `${Math.round(PASS_MARK * 100)}% to pass`, value: checkAverage(s),
      go: () => act((p) => openLesson(p, firstOpenLesson(p))),
    },
    {
      num: "03", title: "Final assessment", sub: s.post ? "Done" : "After Day 21", value: postP ?? "—",
      go: () => act((p) => openFinal(p)),
    },
  ];
  const gm = Math.floor(s.todaySec / 60);
  const met = s.todaySec >= s.goal * 60;
  const heroVerb = `${doneCount || s.t ? "Continue" : "Start"} ${lessonDay(s.cur)}`;

  return (
    <div className="sd-a-screen flex w-full max-w-[1120px] flex-col gap-[22px] px-5 pt-2 pb-7 lg:gap-7 lg:px-0 lg:pt-0 lg:pb-0">
      {/* Mobile header: wordmark, bell and streak. */}
      <div className="flex items-center justify-between lg:hidden">
        <Image src="/brand/klymb-logo.svg" alt="Klymb.ai" width={104} height={16} className="h-4 w-auto" priority />
        <div className="flex items-center gap-1.5">
          <BellButton s={s} act={act} />
          <button type="button" onClick={() => act((p) => ({ ...p, screen: "progress", tab: "progress" }))} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-sd-divider px-2.5 text-[13px] font-extrabold hover:bg-sd-accent-100">
            <span className="flex text-sd-accent"><Icon name="flame" size={16} /></span>{st.current} {st.current === 1 ? "day" : "days"}
          </button>
        </div>
      </div>

      {/* Greeting; on mobile it drifts and fades on scroll. */}
      <div className="sd-drift flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="m-0 text-[28px] leading-[1.1] tracking-[-0.02em]">{hello}</h1>
        <span className="text-[13px] font-semibold text-sd-n-700">{doneCount} of {LESSON_COUNT} lessons · {coursePct}</span>
      </div>

      <button
        type="button"
        onClick={() => act((p) => openLesson(p, p.cur))}
        {...parallax}
        aria-label={`${heroVerb} ${c.title}`}
        className="sd-grid sd-a-in relative flex min-h-[340px] w-full cursor-pointer flex-col justify-between gap-7 overflow-hidden rounded-2xl p-[22px] text-left text-sd-bg lg:min-h-[380px] lg:p-10"
        style={{ animationDuration: ".6s", animationDelay: "50ms" }}
      >
        <div className="sd-mid flex flex-col gap-3.5">
          <span className="text-xs font-extrabold tracking-[0.12em] text-sd-accent-400 uppercase">{lessonDay(s.cur)} · Module {String(c.mi + 1).padStart(2, "0")}</span>
          <span className="sd-near max-w-[760px] text-[40px] leading-[.98] font-extrabold tracking-[-0.035em] text-balance lg:text-[64px]">{c.title}</span>
        </div>
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex justify-between gap-3 text-[13px] text-sd-n-300">
              <span className="min-w-0 truncate">{c.m.title}</span>
              <span className="flex-none font-bold whitespace-nowrap text-sd-bg">{fmt(s.t)} / {c.dur}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/18">
              <div className="h-full rounded-full bg-sd-accent-400 transition-[width] duration-600" style={{ width: `${Math.min(100, (s.t / c.secs) * 100)}%` }} />
            </div>
          </div>
          <span className="flex h-[52px] w-full flex-none items-center justify-between gap-4 rounded-[10px] bg-sd-accent-400 px-[18px] text-base font-extrabold text-sd-ink lg:w-[240px]">
            {heroVerb}
            <span className="flex"><Icon name="play" size={20} /></span>
          </span>
        </div>
      </button>

      <div className="sd-a-in flex flex-wrap items-center justify-between gap-3" style={{ animationDuration: ".5s", animationDelay: "100ms" }}>
        <div className="flex min-w-0 flex-1 flex-[1_1_260px] items-center gap-3">
          <Image src="/mascots/kamran-excited-v2.png" alt="Kamran, your study buddy" width={52} height={52} className="size-[52px] flex-none object-contain" />
          <p className="m-0 text-sm leading-[1.4] text-pretty text-sd-n-800">{kamranSays(s, firstName(user))}</p>
        </div>
        {!user && s.done.length > 0 && (
          <div className="w-full sm:w-[280px]"><GoogleButton lesson={s.cur} where="home" label="Save progress with Google" className="h-11 border-2 border-sd-ink" /></div>
        )}
      </div>

      {referral && <ReferralCard r={referral} className="sd-a-in lg:max-w-[560px]" />}

      <div className="grid items-start gap-6 border-t-2 border-sd-divider pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-7 lg:pt-6">
        <section aria-label="Today" className="sd-a-in flex min-w-0 flex-col gap-[18px]" style={{ animationDuration: ".5s", animationDelay: "150ms" }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h6 className="sd-h6 m-0">Today’s goal</h6>
              <span className="text-xs font-bold text-sd-accent-700">{met ? "Goal met" : `${s.goal - gm} min to go`}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[40px] leading-none font-extrabold tracking-[-0.03em]">{Math.min(gm, s.goal)}</span>
              <span className="text-[15px] font-bold text-sd-n-700">/ {s.goal} min</span>
            </div>
            <Bar value={(s.todaySec / (s.goal * 60)) * 100} className="h-1.5" />
            <span className="text-xs text-sd-n-700">One lesson keeps your streak.</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h6 className="sd-h6 m-0">This week</h6>
              <span className="text-xs text-sd-n-700">{week.filter((d) => d.done).length} of 7 days</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {week.map(({ l, done, today }, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={clsx("sd-a-pop flex aspect-square w-full max-w-11 items-center justify-center rounded-lg text-sd-bg", done ? "bg-sd-accent" : "border-[1.5px] border-dashed border-sd-divider")}
                    style={stagger(i, 50, 350)}
                  >
                    {done && <Icon name="check" size={14} stroke={3} />}
                  </div>
                  <span className={clsx("text-[11px]", today ? "font-extrabold" : "font-normal")}>{today ? "Today" : l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Your path" className="sd-a-in min-w-0" style={{ animationDuration: ".5s", animationDelay: "200ms" }}>
          <h6 className="sd-h6 mb-2">Your path</h6>
          <div className="border-t border-sd-divider">
            {path.map((r, i) => (
              <button
                key={r.num}
                type="button"
                onClick={r.go}
                className="sd-a-in grid min-h-[60px] w-full cursor-pointer grid-cols-[32px_1fr_auto_20px] items-center gap-2.5 border-b border-sd-divider py-3 text-left hover:bg-sd-ink/4"
                style={stagger(i, 80, 200)}
              >
                <span className="text-[13px] font-extrabold text-sd-accent">{r.num}</span>
                <span className="flex min-w-0 flex-col"><span className="text-base font-extrabold">{r.title}</span><span className="text-xs text-sd-n-700">{r.sub}</span></span>
                <span className="text-sm font-extrabold">{r.value}</span>
                <span className="flex text-sd-n-600"><Icon name="chevR" size={16} /></span>
              </button>
            ))}
          </div>
          <h6 className="sd-h6 mt-6 mb-2">Course intro</h6>
          <OverviewVideo />
        </section>
      </div>
    </div>
  );
}
