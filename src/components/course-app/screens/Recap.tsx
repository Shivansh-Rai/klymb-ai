"use client";

import { MODULES } from "@/data/system-design/course-app";
import { dayOf, isPaywalled, moduleIds, moduleMinutes, openLesson, pad, startQuiz, type CourseState } from "@/lib/course-app";
import { Icon } from "../icons";
import { BackButton, Stats, parallax, stagger } from "../ui";
import type { Act } from "../useCourseApp";
import { StudyBuddy } from "@/components/learner/StudyBuddy";
import { GoogleButton, firstName, useCourseUser } from "../user";

/** Modules that award a badge when finished. */
const MODULE_BADGE: Record<number, { name: string; icon: "zap" | "db" }> = { 0: { name: "Started right", icon: "zap" } };

/** Three takeaways for a finished module: the first points of its lessons' cheatsheets. */
function takeaways(s: CourseState, mi: number) {
  const points = moduleIds(mi).flatMap((id) => dayOf(id)?.copy[s.lang].cheatsheet.points ?? []);
  return points.slice(0, 3);
}

/** Kamran's line on a finished module: well done, and what comes next. */
function kamranSays(rm: number, first: string | null) {
  const hi = first ? `Well done, ${first}!` : "Well done!";
  const nextDay = dayOf(`${rm + 1}-0`);
  const next = MODULES[rm + 1];
  if (!next) return `${hi} That’s the whole course. Take the post-assessment and see how far you’ve come.`;
  if (isPaywalled(`${rm + 1}-0`)) return `${hi} You finished ${MODULES[rm].title}. ${next.title} is in the full course.`;
  if (!nextDay) return `${hi} You finished ${MODULES[rm].title}. ${next.title} is coming soon, I’ll keep it ready.`;
  return `${hi} You finished ${MODULES[rm].title}. Next up: Day ${nextDay.day}, ${nextDay.app}. About ${nextDay.minutes} minutes.`;
}

export function Recap({ s, act }: { s: CourseState; act: Act }) {
  const user = useCourseUser();
  const rm = s.recapMod;
  const mod = MODULES[rm];
  const next = MODULES[rm + 1];
  const badge = MODULE_BADGE[rm];
  const notes = moduleIds(rm).reduce((n, id) => n + (s.notes[id]?.length ?? 0), 0);
  const goNext = () => act((p) => (next ? openLesson(p, `${rm + 1}-0`) : startQuiz(p, "post")));
  const review = () => act((p) => ({ ...p, screen: "player", cur: moduleIds(rm)[moduleIds(rm).length - 1], ptab: "notes", t: 0, playing: false }));
  const n = moduleIds(rm).length;

  return (
    <div className="sd-a-screen box-border flex flex-1 max-w-[960px] flex-col gap-5 px-5 pb-6 lg:p-0">
      <div className="-mx-2 lg:mx-0"><BackButton kind="close" onClick={() => act((p) => ({ ...p, screen: "course", tab: "course" }))} /></div>
      <div {...parallax} className="sd-a-pop flex flex-col gap-2 overflow-hidden rounded-xl bg-sd-accent p-5 text-sd-bg lg:p-7" style={{ animationDuration: ".6s" }}>
        <span className="sd-kicker">Module {pad(rm + 1)} complete</span>
        <span className="sd-near text-[40px] leading-[0.95] font-extrabold tracking-[-0.04em] lg:text-[64px]">{mod.title}</span>
      </div>
      <div className="sd-a-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "250ms" }}>
        <StudyBuddy tone="light" size={88} message={kamranSays(rm, firstName(user))} />
        {!user && <div className="sm:w-[280px]"><GoogleButton lesson={`${rm + 1}-0`} where="recap" label="Save progress with Google" className="h-11 border-2 border-sd-ink" /></div>}
      </div>
      <Stats className="border-t-2 border-t-sd-divider" cellClass="py-2.5" valueClass="text-[26px]" items={[[`${n}/${n}`, "lessons"], [`${moduleMinutes(rm)} min`, "watched"], [notes, "notes"]]} />
      <div>
        <h6 className="sd-h6 mb-2">Key takeaways</h6>
        <div className="border-t-2 border-sd-divider">
          {takeaways(s, rm).map((t, i) => (
            <div key={i} className="sd-a-in grid grid-cols-[32px_1fr] gap-2.5 border-b border-sd-divider py-3" style={stagger(i, 90, 250)}>
              <span className="text-base font-extrabold text-sd-accent">{pad(i + 1)}</span>
              <span className="text-[15px] leading-[1.4]">{t}</span>
            </div>
          ))}
        </div>
      </div>
      {badge && (
        <div className="sd-a-pop flex items-center gap-3 rounded-xl bg-sd-ink px-3.5 py-3 text-sd-bg" style={{ animationDelay: "600ms" }}>
          <span aria-hidden="true" className="size-11 flex-none rounded-full p-[3px]" style={{ background: "conic-gradient(from 210deg,#fbdcdd,#c4454b,#5a0307,#f0868b,#fbdcdd)" }}>
            <span className="flex size-full items-center justify-center rounded-full text-white" style={{ background: "radial-gradient(circle at 35% 30%,#c4454b,#5a0307 72%)" }}><Icon name={badge.icon} size={20} /></span>
          </span><span className="text-[15px] font-extrabold">Badge earned: {badge.name}</span>
        </div>
      )}
      {badge && <button type="button" onClick={() => act((p) => ({ ...p, screen: "progress", tab: "progress" }))} className="sd-btn sd-btn-secondary min-h-11 self-start px-4">Download and share your badge <Icon name="arrowR" size={16} /></button>}
      <div className="mt-auto flex flex-col gap-2 lg:max-w-[280px]">
        <button type="button" onClick={goNext} className="sd-btn sd-btn-primary sd-btn-block h-[52px] justify-between text-[15px]">{next ? `Start Module ${pad(rm + 2)}: ${next.title}` : "Take the post-assessment"}<Icon name="arrowR" /></button>
        <button type="button" onClick={review} className="sd-btn sd-btn-secondary sd-btn-block h-12">Review your notes</button>
      </div>
    </div>
  );
}
