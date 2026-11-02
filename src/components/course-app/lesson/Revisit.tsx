"use client";

import clsx from "clsx";
import type { Day, DayCopy } from "@/data/system-design/types";
import { PRACTICE_KEYS, checkPct, lessonSteps, markShared, type CourseState, type LessonProgress, type StepKey } from "@/lib/course-app";
import { Icon } from "../icons";
import type { Act } from "../useCourseApp";
import { Answers } from "./LessonCheck";
import { CheatsheetBlock, InterviewBlock, UI as PRACTICE_UI, inRange, type Ui } from "./Practice";
import { ShareCard } from "./ShareCard";

const UI = {
  en: {
    assessment: "Assessment", passedWith: (n: number) => `Passed with ${n}%`, attempts: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
    showAnswers: "Show answers and why", hideAnswers: "Hide answers", retake: "Retake the check",
    noAnswers: "Your answers aren’t saved on this device. Retake the check to see them again.",
    extra: "Extra practice", extraSub: "Not mandatory, but highly recommended.", done: "Done", notStarted: "Not started",
    open: "Open", start: "Start", notes: "Cheatsheet and script",
  },
  hi: {
    assessment: "Assessment", passedWith: (n: number) => `${n}% ke saath pass`, attempts: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
    showAnswers: "Jawab aur wajah dekho", hideAnswers: "Jawab chhupao", retake: "Check dobara do",
    noAnswers: "Tumhare jawab is device pe save nahi hain. Dekhne ke liye check dobara do.",
    extra: "Extra practice", extraSub: "Zaroori nahi, par bahut recommended.", done: "Ho gaya", notStarted: "Shuru nahi hua",
    open: "Kholo", start: "Shuru karo", notes: "Cheatsheet aur script",
  },
};

/** What a finished practice part came to, in the words the lesson-end screen uses. */
function result(key: StepKey, p: LessonProgress, c: DayCopy, ui: Ui): string | null {
  switch (key) {
    case "estimate": return p.est && c.estimates ? ui.estimated(inRange(c.estimates, p.est), c.estimates.length) : null;
    case "build": return p.built !== undefined ? ui.built(p.built) : null;
    case "draw": return p.drawn ? ui.drawn(p.drawn.score, p.drawn.of) : null;
    case "design": return p.design ? ui.designed : null;
    case "follow": return p.follow ? ui.followed(p.follow.filter(Boolean).length, p.follow.length) : null;
    default: return null;
  }
}

/** A numbered section heading, so the page reads as parts in order. */
function Heading({ n, title, aside }: { n: number; title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-sd-ink pb-2">
      <h4 className="m-0 flex items-baseline gap-2.5 text-[22px] leading-none tracking-[-0.02em]">
        <span className="text-[13px] font-extrabold text-sd-accent">{String(n).padStart(2, "0")}</span>{title}
      </h4>
      {aside}
    </div>
  );
}

/**
 * What a passed lesson shows under its video when it's visited again, in the
 * order that matters: share it, see how the check went, do the extra practice,
 * and keep the cheatsheet and script to hand.
 */
export function Revisit({ s, act, id, day }: { s: CourseState; act: Act; id: string; day: Day }) {
  const ui = UI[s.lang];
  const pui = PRACTICE_UI[s.lang];
  const c = day.copy[s.lang];
  const p: LessonProgress = s.lessons[id] ?? {};
  const questions = p.review?.[s.lang];
  const picks = p.checkPicks ?? p.post;
  const parts = lessonSteps(s, id, day).filter((x) => PRACTICE_KEYS.includes(x.key));
  const pct = p.check ?? (p.post ? checkPct(c.post, p.post) : 0);
  const tries = p.tries ?? 1;

  return (
    <div className="flex flex-col gap-8 pt-6 pb-8">
      <ShareCard lang={s.lang} id={id} day={day} c={c} shared={!!p.shared} onShared={() => act((q) => markShared(q, id))} showText />

      <section aria-label={ui.assessment}>
        <Heading n={1} title={ui.assessment} aside={<span className="text-[13px] font-bold text-sd-n-700">{ui.passedWith(pct)} · {ui.attempts(tries)}</span>} />
        {questions && picks ? (
          <details className="group">
            <summary className="sd-btn sd-btn-secondary h-11 w-fit cursor-pointer list-none gap-2">
              <span className="group-open:hidden">{ui.showAnswers}</span><span className="hidden group-open:inline">{ui.hideAnswers}</span>
              <Icon name="chevD" size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="pt-3"><Answers questions={questions} lang={s.lang} picks={picks} /></div>
          </details>
        ) : (
          <p className="m-0 text-sm text-sd-n-700">{ui.noAnswers}</p>
        )}
        <button type="button" onClick={() => act((q) => ({ ...q, stage: "prove", checkStage: "intro", checkIdx: 0, checkBusy: false }))} className="sd-btn sd-btn-ghost mt-2 h-11 gap-2">
          <Icon name="rotL" size={16} />{ui.retake}
        </button>
      </section>

      {parts.length > 0 && (
        <section aria-label={ui.extra}>
          <Heading n={2} title={ui.extra} aside={<span className="text-[13px] text-sd-n-700">{ui.extraSub}</span>} />
          <ul className="m-0 flex list-none flex-col border-t border-sd-divider p-0">
            {parts.map((x) => {
              const res = result(x.key, p, c, pui);
              return (
                <li key={x.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-sd-divider py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-md border-[1.5px]", x.done ? "border-sd-ink bg-sd-ink text-sd-bg" : "border-sd-divider text-transparent")}>
                      <Icon name="check" size={14} stroke={3} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-extrabold">{pui.steps[x.key]}</span>
                      <span className="text-[13px] text-sd-n-700">{res ?? ui.notStarted}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => act((q) => ({ ...q, stage: x.key, estIdx: 0, fuIdx: 0 }))} className={clsx("sd-btn h-10 gap-2", x.done ? "sd-btn-secondary" : "sd-btn-primary")}>
                    {x.done ? ui.open : ui.start}<Icon name="arrowR" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label={ui.notes} className="flex flex-col gap-6">
        <Heading n={parts.length > 0 ? 3 : 2} title={ui.notes} />
        <CheatsheetBlock c={c} ui={pui} />
        <InterviewBlock c={c} ui={pui} />
      </section>
    </div>
  );
}
