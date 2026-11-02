"use client";

import "./course-app.css";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { TAB_SCREENS, fmt, hasQuickCheck, lesson, miniActive, openLesson, streak, togglePlay, type CourseState, type LessonContent, type Tab } from "@/lib/course-app";
import type { ReferralView } from "@/lib/sd-offer";
import { Icon, type IconName } from "./icons";
import { Commitment, LeaveQuizDialog, Onboarding, PaywallSheet, QuickCheckSheet, Splash, StreakPop, Toast } from "./Overlays";
import { ReferralProvider, ReferralSheet } from "./Referral";
import { Course } from "./screens/Course";
import { Home } from "./screens/Home";
import { Notifications } from "./screens/Inbox";
import { Player } from "./screens/Player";
import { Profile } from "./screens/Profile";
import { Progress } from "./screens/Progress";
import { QuizIntro, QuizQuestion } from "./screens/Quiz";
import { Recap } from "./screens/Recap";
import { Results } from "./screens/Results";
import { useCourseApp, type Act } from "./useCourseApp";
import { CourseUserProvider, type CourseUser } from "./user";

const TABS: [Tab, string, IconName][] = [["home", "Home", "home"], ["course", "Course", "layers"], ["progress", "Progress", "chart"], ["profile", "Profile", "user"]];

function Screen({ s, act }: { s: CourseState; act: Act }) {
  switch (s.screen) {
    case "home": return <Home s={s} act={act} />;
    case "course": return <Course s={s} act={act} />;
    case "progress": return <Progress s={s} />;
    case "profile": return <Profile s={s} act={act} />;
    case "player": return <Player s={s} act={act} />;
    case "quiz": return s.quiz.stage === "intro" ? <QuizIntro s={s} act={act} /> : <QuizQuestion key={s.quiz.kind} s={s} act={act} />;
    case "results": return <Results key={s.lastKind} s={s} act={act} />;
    case "notifs": return <Notifications s={s} act={act} />;
    case "recap": return <Recap s={s} act={act} />;
    default: return null;
  }
}

/** Keeps the current lesson playing while you browse. Above the tabs on mobile, bottom-right on web. */
function MiniPlayer({ s, act, className }: { s: CourseState; act: Act; className?: string }) {
  const c = lesson(s.cur);
  const resume = () => act((p) => openLesson(p, p.cur));
  return (
    <div className={clsx("sd-a-in relative grid grid-cols-[44px_minmax(0,1fr)_40px_32px] items-center gap-2.5 overflow-hidden rounded-xl bg-sd-ink p-2 text-sd-bg", className)} style={{ animationDuration: ".3s" }}>
      <div className="absolute top-0 left-0 h-[3px] bg-sd-accent transition-[width] duration-1000 ease-linear" style={{ width: `${((s.t / c.secs) * 100).toFixed(2)}%` }} />
      <button type="button" onClick={resume} aria-label={`Open ${c.title}`} className="size-11 cursor-pointer rounded-lg bg-sd-accent text-xs font-extrabold">{c.code}</button>
      <button type="button" onClick={resume} className="flex min-w-0 cursor-pointer flex-col p-0 text-left">
        <span className="truncate text-[13px] font-extrabold">{c.title}</span>
        <span className="text-[11px]">{fmt(s.t)} / {c.dur}</span>
      </button>
      <button type="button" onClick={() => act(togglePlay)} aria-label={s.playing ? "Pause" : "Play"} className="sd-btn sd-btn-icon size-10 text-sd-bg"><Icon name={s.playing ? "pause" : "play"} size={16} /></button>
      <button type="button" onClick={() => act((p) => ({ ...p, playing: false, miniHide: p.cur }))} aria-label="Close player" className="sd-btn sd-btn-icon h-10 w-8 text-sd-bg"><Icon name="x" size={16} /></button>
    </div>
  );
}

const INBOX = true;
const NO_PASSES: Record<string, number> = {};

function Sidebar({ s, act }: { s: CourseState; act: Act }) {
  const unread = s.notifs.filter((n) => n.unread).length;
  const st = streak(s);
  return (
    <aside className="hidden h-dvh flex-col gap-7 overflow-y-auto border-r-2 border-sd-divider py-6 lg:flex">
      <div className="px-6"><Image src="/brand/klymb-logo.svg" alt="Klymb.ai" width={117} height={18} className="h-[18px] w-auto" priority /></div>
      <div className="px-6">
        <div className="text-[11px] font-semibold tracking-[0.1em] text-sd-accent-700 uppercase">Course</div>
        <div className="text-[17px] font-extrabold">System Design Essentials</div>
      </div>
      <nav aria-label="Course" className="flex flex-col border-t-2 border-sd-divider">
        {TABS.map(([k, label, icon]) => {
          const on = s.tab === k;
          return (
            <button
              key={k}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => act((p) => ({ ...p, screen: k, tab: k, confirmExit: false }))}
              className={clsx("flex cursor-pointer items-center gap-3 border-b border-l-[3px] border-b-sd-divider py-[13px] pr-[21px] pl-[21px] text-left text-[15px] font-extrabold hover:bg-sd-accent-100", on ? "border-l-sd-accent text-sd-accent" : "border-l-transparent")}
            >
              <Icon name={icon} />{label}
            </button>
          );
        })}
      </nav>
      {INBOX && <button type="button" onClick={() => act((p) => ({ ...p, screen: "notifs" }))} className="-mt-4 flex cursor-pointer items-center gap-3 px-6 py-[13px] text-left text-[15px] font-extrabold hover:bg-sd-accent-100">
        <Icon name="bell" /><span className="flex-1">Notifications</span>
        {unread > 0 && <span className="h-5 min-w-5 rounded-full bg-sd-accent px-1.5 text-[11px] leading-5 font-extrabold text-sd-bg">{unread}<span className="sr-only"> unread</span></span>}
      </button>}
      <button type="button" onClick={() => act((p) => ({ ...p, screen: "progress", tab: "progress" }))} className="mx-6 mt-auto flex cursor-pointer flex-col gap-0.5 rounded-xl bg-sd-accent p-3.5 text-left text-sd-bg hover:bg-sd-accent-600">
        <span className="flex items-start justify-between"><span className="text-[44px] leading-[0.9] font-extrabold tracking-[-0.04em]">{st.current}</span><Icon name="flame" /></span>
        <span className="mt-1.5 text-sm font-extrabold">{st.current ? "day streak" : "Start your streak today"}</span>
      </button>
    </aside>
  );
}

function TabBar({ s, act }: { s: CourseState; act: Act }) {
  return (
    <nav aria-label="Course" className="grid flex-none grid-cols-4 border-t-2 border-sd-divider bg-sd-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map(([k, label, icon]) => {
        const on = s.tab === k;
        return (
          <button
            key={k}
            type="button"
            aria-current={on ? "page" : undefined}
            onClick={() => act((p) => ({ ...p, screen: k, tab: k, confirmExit: false }))}
            className={clsx("flex cursor-pointer flex-col items-start gap-1 px-3 pt-3 pb-1.5 text-xs font-extrabold hover:bg-sd-accent-100", on && "text-sd-accent")}
          >
            <Icon name={icon} size={22} /><span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * The System Design course app: one responsive layout. Under 1024px it is the
 * mobile app (tabs along the bottom, full-screen lessons and assessments);
 * from 1024px a sidebar replaces the tabs and panels sit side by side.
 * `lessons` is what this viewer may open, read on the server: paid lessons
 * reach the browser only this way.
 */
export function CourseApp({ user = null, lessons, enrolled, referral = null, passes = NO_PASSES }: { user?: CourseUser | null; lessons: Record<string, LessonContent>; enrolled: boolean; referral?: ReferralView | null; passes?: Record<string, number> }) {
  const { s, act, ready } = useCourseApp({ lessons, enrolled, passes });
  const scroller = useRef<HTMLDivElement>(null);

  // The app is one screen tall and scrolls inside. If the page behind it could scroll too, phone browsers would
  // slide the whole app up as their bars collapse, leaving a gap under the tab bar.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("sd-locked");
    return () => root.classList.remove("sd-locked");
  }, []);

  // Every screen opens at the top.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = 0;
    el.style.setProperty("--sy", "0");
  }, [s.screen, s.quiz.stage, s.stage, s.checkStage]);

  if (!ready) return <div className="sd-app h-dvh" />;

  const showTabs = TAB_SCREENS.includes(s.screen);
  const mini = miniActive(s) && !s.ended;

  return (
    <CourseUserProvider value={user}>
    <ReferralProvider value={referral}>
    <div className="sd-app relative flex h-dvh flex-col overflow-hidden lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <Sidebar s={s} act={act} />
      <div
        ref={scroller}
        onScroll={(e) => e.currentTarget.style.setProperty("--sy", String(Math.round(e.currentTarget.scrollTop)))}
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain pt-[max(8px,env(safe-area-inset-top))] lg:h-dvh lg:px-10 lg:pt-7 lg:pb-10"
      >
        {s.offline && (
          <div className="sd-a-in mb-2 flex flex-none items-center gap-2.5 bg-sd-ink px-5 py-2.5 text-[13px] text-sd-bg lg:mb-5 lg:px-4" style={{ animationDuration: ".3s" }} role="status">
            <span className="flex text-sd-accent-400"><Icon name="wifiOff" size={16} /></span>
            <span className="flex-1">You’re offline. Reconnect to keep watching.</span>
          </div>
        )}
        <main id="sd-main" className="flex flex-1 flex-col">
          <Screen s={s} act={act} />
        </main>
      </div>

      {showTabs && (
        <div className="flex flex-none flex-col lg:hidden">
          {mini && <MiniPlayer s={s} act={act} />}
          <TabBar s={s} act={act} />
        </div>
      )}
      {mini && <MiniPlayer s={s} act={act} className="sd-shadow-lg fixed! right-6 bottom-5 z-[4] hidden w-[420px] lg:grid" />}

      {s.screen === "splash" && <Splash act={act} />}
      {s.screen === "onboard" && <Onboarding s={s} act={act} />}
      {s.screen === "commit" && <Commitment s={s} act={act} />}
      {s.streakPop && <StreakPop s={s} act={act} />}
      {s.qcOpen && s.screen === "player" && hasQuickCheck(s.cur) && <QuickCheckSheet s={s} act={act} />}
      {s.confirmExit && <LeaveQuizDialog s={s} act={act} />}
      {s.paywall && <PaywallSheet s={s} act={act} />}
      {referral?.state === "open" && !s.referralSeen && showTabs && <ReferralSheet r={referral} act={act} />}
      {s.toast && <Toast text={s.toast} />}
    </div>
    </ReferralProvider>
    </CourseUserProvider>
  );
}
