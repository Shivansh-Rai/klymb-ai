"use client";

import clsx from "clsx";
import type { Day, DayCopy } from "@/data/system-design/types";
import { ALL_IDS, PRACTICE_KEYS, assessmentParts, assessmentStep, completeNext, isPaywalled, isSoon, lessonSteps, markShared, pad, practiceStart, practiceStep, practiceTotal, score, updateLesson, type CourseState, type LessonProgress, type StepKey } from "@/lib/course-app";
import { Icon } from "../icons";
import { stagger } from "../ui";
import type { Act } from "../useCourseApp";
import { DesignIt } from "./DesignIt";
import { DesignCanvas } from "./DesignCanvas";
import { DiagramBuilder } from "./DiagramBuilder";
import { EstimateQuiz } from "./EstimateQuiz";
import { Feedback } from "./Feedback";
import { FollowUps } from "./FollowUps";
import { LessonCheck } from "./LessonCheck";
import { StudyBuddy } from "@/components/learner/StudyBuddy";
import { ShareCard } from "./ShareCard";
import { GoogleButton, useCourseUser } from "../user";

export const UI = {
  en: {
    steps: { watch: "Watch", reveal: "Learn", prove: "Prove it", estimate: "Estimate", build: "Build it", draw: "Draw it", design: "Design it", follow: "Follow-ups", done: "Done" } as Record<StepKey, string>,
    assessment: "Assessment", dayComplete: "Day complete",
    reveal: "What really happens", build: "Build it yourself", prove: "Prove it", follow: "Interviewer follow-ups", unlocked: "Day complete",
    proveSub: "5 questions · 60% to pass · answers at the end", concept: "Today’s idea",
    built: (n: number) => (n === 0 ? "Built, first try." : `Built · ${n} wrong ${n === 1 ? "drop" : "drops"}`),
    drawn: (n: number, of: number) => `Drawn · ${n} of ${of} connections`,
    followed: (n: number, of: number) => `You had ${n} of ${of} follow-ups covered.`,
    estimate: "Estimate it", estimateSub: "Back-of-the-envelope numbers", estimated: (n: number, of: number) => `${n} of ${of} estimates in range.`,
    design: "Design it", designSub: "Attempt first, then the walkthrough", designed: "Attempt written, walkthrough read.",
    reference: "Optional reference",
    scored: (b: number, bOf: number) => `Prove it: ${b} of ${bOf} right`,
    savePrompt: (day: number) => `Day ${day} done! Sign in so it’s saved to your name, on any phone or laptop, and your streak keeps counting.`,
    readDone: "Got it", toNext: (label: string) => `Next: ${label}`,
    cheatsheet: "Cheatsheet", interview: "Say it in 2 minutes",
    complete: "Mark complete", redo: "Do this lesson again",
    nextLesson: "Next lesson", practise: "Practise extra exercises", practiseSub: "Not mandatory, but highly recommended", practised: "Extra practice done. Do it again any time.", extra: "Extra practice",
  },
  hi: {
    steps: { watch: "Watch", reveal: "Samjho", prove: "Prove it", estimate: "Estimate", build: "Build it", draw: "Draw it", design: "Design it", follow: "Follow-ups", done: "Done" } as Record<StepKey, string>,
    assessment: "Assessment", dayComplete: "Din complete",
    reveal: "Asal mein kya hota hai", build: "Khud banao", prove: "Prove it", follow: "Interviewer follow-ups", unlocked: "Day complete",
    proveSub: "5 sawaal · 60% se pass · jawab end mein", concept: "Aaj ka idea",
    built: (n: number) => (n === 0 ? "Pehli baar mein ban gaya." : `Ban gaya · ${n} galat ${n === 1 ? "drop" : "drops"}`),
    drawn: (n: number, of: number) => `Draw ho gaya · ${of} mein se ${n} connections`,
    followed: (n: number, of: number) => `${of} mein se ${n} follow-ups aate the.`,
    estimate: "Estimate it", estimateSub: "Rough hisaab, napkin pe", estimated: (n: number, of: number) => `${of} mein se ${n} estimates range mein.`,
    design: "Design it", designSub: "Pehle khud try, phir walkthrough", designed: "Attempt likha, walkthrough padha.",
    reference: "Optional reference",
    scored: (b: number, bOf: number) => `Prove it: ${bOf} mein se ${b} sahi`,
    savePrompt: (day: number) => `Day ${day} ho gaya! Sign in karo taaki yeh tumhare naam pe save ho, kisi bhi phone ya laptop pe, aur streak chalti rahe.`,
    readDone: "Samajh gaya", toNext: (label: string) => `Agla: ${label}`,
    cheatsheet: "Cheatsheet", interview: "2 minute mein aise bolo",
    complete: "Mark complete", redo: "Yeh lesson phir se karo",
    nextLesson: "Agla lesson", practise: "Extra exercises practise karo", practiseSub: "Zaroori nahi, par bahut recommended", practised: "Extra practice ho gayi. Kabhi bhi phir se karo.", extra: "Extra practice",
  },
};
export type Ui = (typeof UI)["en"];

/** How many estimates landed within tolerance. */
export function inRange(items: { answer: number; tolerance: number }[], mine: number[]) {
  return items.filter((q, i) => mine[i] !== undefined && Math.abs(mine[i] / q.answer - 1) <= q.tolerance).length;
}

/**
 * The assessment's header: what you're in ("Assessment", or "Day complete"),
 * and while the questions run, how far along you are — the big N / 14 that
 * counts the check, the estimates, the build, the design and the follow-ups.
 */
function AssessmentHeader({ s, id, ui }: { s: CourseState; id: string; ui: Ui }) {
  const extra = PRACTICE_KEYS.includes(s.stage);
  const n = extra ? practiceStep(s, id) : assessmentStep(s);
  const total = extra ? practiceTotal(id, s.lang) : assessmentParts(id, s.lang).sizes.prove;
  return (
    <div className="flex flex-col gap-2.5 border-b border-sd-divider pb-3.5">
      <div className="flex items-end justify-between gap-3">
        <span className="pb-1 text-[11px] font-extrabold tracking-[0.12em] uppercase text-sd-accent-700">{s.stage === "done" ? ui.dayComplete : extra ? ui.extra : ui.assessment}</span>
        {n > 0 && (
          <span aria-label={`Question ${n} of ${total}`} className="flex items-baseline gap-[3px] font-extrabold tracking-[-0.03em]">
            <span className="text-[34px] leading-none">{n}</span>
            <span className="text-[15px] text-sd-n-600">/ {total}</span>
          </span>
        )}
      </div>
      {n > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-sd-n-300">
          <div className="h-full rounded-full bg-sd-accent transition-[width] duration-400" style={{ width: `${(n / total) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

/** A step already finished: what you did, and the way on. */
function Done({ text, next, onNext }: { text: string; next: string; onNext: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm font-extrabold"><span className="flex size-6 items-center justify-center rounded-md bg-sd-ink text-sd-bg"><Icon name="check" size={14} stroke={3} /></span>{text}</span>
      <button type="button" onClick={onNext} className="sd-btn sd-btn-secondary h-10 gap-2">{next}<Icon name="arrowR" size={16} /></button>
    </div>
  );
}

function Explain({ items }: { items: NonNullable<DayCopy["explain"]>["items"] }) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((x) => (
        <div key={x.term} className="flex flex-col gap-1 border-l-2 border-sd-n-300 py-1 pl-3">
          <span className="text-sm font-extrabold">{x.term}</span>
          <span className="text-[13px] leading-[1.45] text-sd-n-800">{x.what}</span>
          <span className="text-xs text-sd-n-700">e.g. {x.example}</span>
        </div>
      ))}
    </div>
  );
}

function Reveal({ c, ui, read, onRead }: { c: DayCopy; ui: Ui; read: boolean; onRead: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h6 className="sd-h6 mb-2">{c.revealTitle}</h6>
        <div className="border-t-2 border-sd-divider">
          {c.reveal.map((r, i) => (
            <div key={r.what} className="sd-a-in grid grid-cols-[150px_1fr] gap-3 border-b border-sd-divider py-2.5 text-sm max-sm:grid-cols-1 max-sm:gap-0.5" style={stagger(i, 50, 0)}>
              <span className="font-extrabold text-sd-accent-700">{r.when}</span>
              <span className="leading-[1.45]">{r.what}</span>
            </div>
          ))}
        </div>
        {c.sourceNote && <span className="mt-2 block text-xs text-sd-n-700">{c.sourceNote}</span>}
      </div>
      {c.explain && (
        <div>
          <h6 className="sd-h6 mb-2">{c.explain.title}{c.explain.optional && <span className="ml-2 font-semibold text-sd-n-700">· {ui.reference}</span>}</h6>
          <Explain items={c.explain.items} />
        </div>
      )}
      <div>
        <h6 className="sd-h6 mb-2">{ui.concept}</h6>
        <div className="grid gap-2 sm:grid-cols-2">
          {c.concept.cards.map((x, k) => (
            <div key={x.name} className={clsx("flex flex-col gap-2 p-4", k === 0 ? "bg-sd-ink text-sd-bg" : "bg-sd-accent text-sd-bg")}>
              <span className="text-[19px] leading-[1.15] font-extrabold">{x.name}</span>
              <span className="text-xs text-sd-bg/80">{x.examples.join(" · ")}</span>
              <div className="flex flex-col gap-1 border-t border-white/25 pt-2 text-sm">{x.moves.map((m) => <span key={m}>{m}</span>)}</div>
            </div>
          ))}
        </div>
        <p className="m-0 mt-4 border-t-2 border-sd-ink pt-3.5 text-[20px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance lg:text-[26px]">{c.concept.rule}</p>
      </div>
      {!read && <button type="button" onClick={onRead} className="sd-btn sd-btn-primary h-[52px] w-full max-w-[280px] justify-between px-[18px] text-base">{ui.toNext(ui.steps.prove)}<Icon name="arrowR" size={18} /></button>}
    </div>
  );
}

/** The day's cheatsheet, point by point. */
export function CheatsheetBlock({ c, ui }: { c: DayCopy; ui: Ui }) {
  return (
    <div>
      <h6 className="sd-h6 mb-2">{ui.cheatsheet} · {c.cheatsheet.title}</h6>
      <div className="border-t-2 border-sd-divider">
        {c.cheatsheet.points.map((pt, i) => (
          <div key={pt} className="grid grid-cols-[32px_1fr] gap-2.5 border-b border-sd-divider py-2.5 text-[15px] leading-[1.4]"><span className="font-extrabold text-sd-accent">{pad(i + 1)}</span><span>{pt}</span></div>
        ))}
      </div>
    </div>
  );
}

/** "Say it in 2 minutes": the interview script. */
export function InterviewBlock({ c, ui }: { c: DayCopy; ui: Ui }) {
  return (
    <div>
      <h6 className="sd-h6 mb-2">{ui.interview}</h6>
      <div className="flex flex-col gap-2 rounded-xl bg-sd-surface p-4 text-[15px] leading-[1.45]">{c.interview.map((l, i) => <span key={l}><b className="text-sd-accent">{i + 1}.</b> {l}</span>)}</div>
    </div>
  );
}

function Unlocked({ s, act, id, day, c, ui, practice, practised, hasNext, onPractise }: {
  s: CourseState; act: Act; id: string; day: Day; c: DayCopy; ui: Ui;
  practice: StepKey | null; practised: boolean; hasNext: boolean; onPractise: (k: StepKey) => void;
}) {
  const user = useCourseUser();
  const p = s.lessons[id] ?? {};
  return (
    <div className="flex flex-col gap-6">
      <ShareCard lang={s.lang} id={id} day={day} c={c} shared={!!p.shared} onShared={() => act((q) => markShared(q, id))} />
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => act((q) => completeNext(q, false))} className="sd-btn sd-btn-primary h-14 justify-between gap-2 px-[18px] text-base">
          <span className="flex items-center gap-2"><Icon name="check" size={16} />{hasNext ? ui.nextLesson : ui.complete}</span><Icon name="arrowR" size={18} />
        </button>
        {practice && (
          <button type="button" onClick={() => onPractise(practice)} className="sd-btn sd-btn-secondary min-h-14 flex-col items-start justify-center gap-0 px-[18px] py-2 text-left">
            <span className="text-base font-extrabold">{ui.practise}</span>
            <span className="text-xs font-semibold text-sd-n-700">{practised ? ui.practised : ui.practiseSub}</span>
          </button>
        )}
      </div>
      <div className="sd-a-pop flex items-end justify-between rounded-xl bg-sd-accent p-4 text-sd-bg">
        <div className="flex flex-col"><span className="sd-kicker">Day {day.day} complete</span><span className="text-[22px] font-extrabold tracking-[-0.02em]">{ui.scored(score(p.review?.[s.lang] ?? c.post, p.post ?? []), c.post.length)}</span></div>
        <Icon name="flame" size={32} />
      </div>
      {!user && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-sd-ink p-4">
          <StudyBuddy tone="light" size={72} message={ui.savePrompt(day.day)} />
          <GoogleButton lesson={id} where="day-done" label="Save my progress with Google" className="h-12 border-2 border-sd-ink sm:max-w-[360px]" />
        </div>
      )}
      <Feedback lesson={id} day={day.day} lang={s.lang} sent={!!p.feedback} onSent={() => act((q) => updateLesson(q, id, { feedback: true }))} />
      <CheatsheetBlock c={c} ui={ui} />
      <InterviewBlock c={c} ui={ui} />
      <div>
        <button type="button" onClick={() => act((q) => ({ ...updateLesson(q, id, null), t: 0, playing: false, stage: "watch" }))} className="sd-btn sd-btn-ghost h-12">{ui.redo}</button>
      </div>
    </div>
  );
}

/** The step the lesson is on, in place of the video: one at a time, and finishing one opens the next. */
export function LessonStage({ s, act, id, day }: { s: CourseState; act: Act; id: string; day: Day }) {
  const ui = UI[s.lang];
  const c = day.copy[s.lang];
  const p: LessonProgress = s.lessons[id] ?? {};
  const steps = lessonSteps(s, id, day);
  const at = s.stage;
  const after = (k: StepKey) => (k === "prove" ? "done" : steps[steps.findIndex((x) => x.key === k) + 1]?.key ?? "done");
  /** Moves on with a clean assessment: the next part starts at its first question, not where a previous run left off. */
  const go = (k: StepKey) => act((q) => ({ ...q, stage: k, checkStage: k === "prove" ? "intro" : q.checkStage, checkIdx: 0, estIdx: 0, fuIdx: 0 }));
  /** Saves the step and moves the column on to the next one. */
  const set = (patch: Partial<LessonProgress>, next?: StepKey) => act((q) => {
    const n = updateLesson(q, id, patch);
    return next ? { ...n, stage: next, estIdx: 0, fuIdx: 0 } : n;
  });
  const onward = (k: StepKey) => ui.toNext(ui.steps[after(k)]);
  const nextLesson = ALL_IDS[ALL_IDS.indexOf(id) + 1];
  const practice = practiceStart(s, id);
  const practised = steps.filter((x) => PRACTICE_KEYS.includes(x.key)).every((x) => x.done);

  return (
    <div data-tour="practice" className="flex flex-1 flex-col">
      <AssessmentHeader s={s} id={id} ui={ui} />
      <div className="flex flex-1 flex-col pt-4">
        {at === "reveal" && <Reveal c={c} ui={ui} read={!!p.read || !!p.post} onRead={() => set({ read: true }, "prove")} />}

        {at === "prove" && (
          <LessonCheck
            key={id}
            s={s}
            act={act}
            id={id}
            questions={c.post}
            hasNext={!!nextLesson && !isSoon(nextLesson) && !isPaywalled(nextLesson)}
            onPass={() => go(after("prove"))}
            onRewatch={() => act((q) => ({ ...q, stage: "watch", checkBusy: false, checkStage: "intro", t: 0, playing: true, ended: false, upNext: 0 }))}
          />
        )}

        {at === "estimate" && c.estimates?.length ? (
          p.est
            ? <Done text={ui.estimated(inRange(c.estimates, p.est), c.estimates.length)} next={onward("estimate")} onNext={() => go(after("estimate"))} />
            : <EstimateQuiz key={s.lang} items={c.estimates} lang={s.lang} idx={s.estIdx} onIdx={(estIdx) => act((q) => ({ ...q, estIdx }))} onDone={(est) => set({ est }, after("estimate"))} />
        ) : null}

        {at === "build" && c.build && (
          p.built !== undefined
            ? <Done text={ui.built(p.built)} next={onward("build")} onNext={() => go(after("build"))} />
            : <DiagramBuilder key={s.lang} task={c.build} lang={s.lang} onDone={(built) => set({ built }, after("build"))} />
        )}

        {at === "draw" && c.canvas && (
          p.drawn
            ? <Done text={ui.drawn(p.drawn.score, p.drawn.of)} next={onward("draw")} onNext={() => go(after("draw"))} />
            : <DesignCanvas key={s.lang} task={c.canvas} lang={s.lang} saved={p.board} onSave={(board) => set({ board })} onDone={(score, of) => set({ drawn: { score, of } }, after("draw"))} />
        )}

        {at === "design" && c.design && (
          <DesignIt key={s.lang} task={c.design} lang={s.lang} saved={p.design} checks={p.checks} onSave={(design) => set({ design })} onChecks={(checks) => set({ checks })} onContinue={() => go(after("design"))} />
        )}

        {at === "follow" && c.followUps?.length ? (
          p.follow
            ? <Done text={ui.followed(p.follow.filter(Boolean).length, p.follow.length)} next={onward("follow")} onNext={() => go("done")} />
            : <FollowUps key={s.lang} items={c.followUps} lang={s.lang} idx={s.fuIdx} onIdx={(fuIdx) => act((q) => ({ ...q, fuIdx }))} onDone={(follow) => set({ follow }, "done")} />
        ) : null}

        {at === "done" && <Unlocked s={s} act={act} id={id} day={day} c={c} ui={ui} practice={practice} practised={practised} hasNext={!!nextLesson} onPractise={go} />}
      </div>
    </div>
  );
}
