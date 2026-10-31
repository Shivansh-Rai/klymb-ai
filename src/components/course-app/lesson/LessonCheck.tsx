"use client";

import clsx from "clsx";
import { useState } from "react";
import type { Lang, Question } from "@/data/system-design/types";
import { PASS_MARK, assessmentParts, checkPct, pad, passed, submitCheck, updateLesson, type CourseState, type LessonProgress } from "@/lib/course-app";
import { shuffledOrder } from "@/lib/shuffle";
import { Icon } from "../icons";
import { stagger, useCountUp } from "../ui";
import type { Act } from "../useCourseApp";

const PASS = Math.round(PASS_MARK * 100);

const UI = {
  en: {
    title: "Check what you learned",
    count: (n: number) => `${n} questions`, time: "About 15 min", mark: `${PASS}% to pass`, passMark: (n: number) => `Pass mark ${n}%`, answersEnd: "Answers at the end", start: "Start assessment", retake: "Retake assessment",
    scenario: "Scenario", skip: "Skip", next: "Next", finish: "Finish", of: (n: number, t: number) => `${n} of ${t} correct`,
    passed: "Passed", passedBody: (next: boolean) => (next ? `Next lesson unlocked. Pass mark is ${PASS}%.` : `Pass mark is ${PASS}%.`),
    failed: "Not passed yet", failedBody: `You need ${PASS}% to unlock the next lesson. Rewatch the lesson, then retake the assessment.`,
    answers: "Answers", answer: "Answer", yours: "You picked", skipped: "Skipped",
    rewatch: "Rewatch the lesson", rewatchFirst: "Watch the video again to unlock the retake.", continue: "Continue",
    tries: (n: number) => `Attempt ${n}`, passedWith: (n: number) => `Passed with ${n}%`, see: "See answers",
    grading: "Checking…", noGrade: "We couldn’t check your answers. Check your connection and try again.",
  },
  hi: {
    title: "Dekho kitna samjha",
    count: (n: number) => `${n} sawaal`, time: "Lagbhag 15 min", mark: `${PASS}% se pass`, passMark: (n: number) => `Pass mark ${n}%`, answersEnd: "Jawab end mein", start: "Assessment shuru karo", retake: "Assessment dobara do",
    scenario: "Scenario", skip: "Skip", next: "Next", finish: "Finish", of: (n: number, t: number) => `${t} mein se ${n} sahi`,
    passed: "Pass", passedBody: (next: boolean) => (next ? `Agla lesson khul gaya. Pass mark ${PASS}% hai.` : `Pass mark ${PASS}% hai.`),
    failed: "Abhi pass nahi", failedBody: `Agla lesson kholne ke liye ${PASS}% chahiye. Lesson dobara dekho, phir assessment do.`,
    answers: "Jawab", answer: "Jawab", yours: "Tumne chuna", skipped: "Skip kiya",
    rewatch: "Lesson dobara dekho", rewatchFirst: "Retake kholne ke liye video phir se dekho.", continue: "Aage chalo",
    tries: (n: number) => `Attempt ${n}`, passedWith: (n: number) => `${n}% se pass`, see: "Jawab dekho",
    grading: "Check ho raha hai…", noGrade: "Jawab check nahi ho paye. Internet dekho aur dobara try karo.",
  },
};

/** One question at a time, no feedback until the end, so the score is honest. */
function Questions({ questions, lang, idx, busy, error, onIdx, onDone }: { questions: Question[]; lang: Lang; idx: number; busy: boolean; error: string; onIdx: (i: number) => void; onDone: (picks: number[]) => void }) {
  const ui = UI[lang];
  const [picks, setPicks] = useState<number[]>([]);
  const q = questions[idx];
  const last = idx === questions.length - 1;
  const go = (n: number[]) => (last ? onDone(n) : onIdx(idx + 1));
  const anim = idx % 2 ? "sd-a-side" : "sd-a-side-b";
  const pick = picks[idx];

  return (
    <div className="flex flex-1 flex-col">
      <div key={q.id} className={clsx(anim, "flex flex-col gap-[18px]")}>
        {q.scenario && (
          <div className="flex flex-col gap-1.5 rounded-xl bg-sd-ink px-4 py-3.5 text-sd-bg">
            <span className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-sd-accent-400">{ui.scenario}</span>
            <p className="m-0 text-[15px] leading-[1.5] text-pretty">{q.scenario}</p>
          </div>
        )}
        <h3 className="m-0 text-[26px] leading-[1.08] tracking-[-0.03em] text-balance lg:text-[34px]">{q.prompt}</h3>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={q.prompt}>
          {shuffledOrder(q.id, q.choices.length).map((k, pos) => {
            const sel = pick === k;
            return (
              <button
                key={q.choices[k].text}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setPicks((p) => { const n = [...p]; n[idx] = k; return n; })}
                className={clsx(
                  "grid min-h-[60px] cursor-pointer grid-cols-[32px_1fr] items-center gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left text-[15px] leading-[1.4] font-semibold transition-colors hover:border-sd-accent",
                  sel ? "border-sd-accent bg-sd-accent-100" : "border-sd-divider",
                )}
                style={stagger(pos, 60, 80)}
              >
                <span className={clsx("flex size-8 flex-none items-center justify-center rounded-lg border-[1.5px] text-[13px] font-extrabold transition-colors", sel ? "border-sd-accent bg-sd-accent text-sd-bg" : "border-sd-divider")}>{String.fromCharCode(65 + pos)}</span>
                <span className="text-pretty">{q.choices[k].text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 z-[4] -mx-5 mt-auto border-t border-sd-divider bg-sd-bg px-5 pt-2.5 pb-4 shadow-[0_-10px_20px_-14px_rgba(32,30,29,.25)] lg:mx-0 lg:px-10 lg:pt-3.5 lg:pb-[18px]">
        {error && <p role="alert" className="m-0 mb-2 text-[13px] font-semibold text-sd-accent-700">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => go(picks)} disabled={busy} className="sd-btn sd-btn-ghost h-[52px] px-3.5 text-[15px] text-sd-n-800">{ui.skip}</button>
          <span className="flex-1" />
          <button type="button" onClick={() => go(picks)} disabled={pick === undefined || busy} className="sd-btn sd-btn-primary h-[52px] flex-1 max-w-[280px] justify-between rounded-[10px] px-[18px] text-base">
            {busy ? ui.grading : last ? ui.finish : ui.next}<Icon name="arrowR" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** The score, the verdict, and every question with its answer explained. */
function Results({ questions, lang, picks, hasNext, children }: { questions: Question[]; lang: Lang; picks: number[]; hasNext: boolean; children: React.ReactNode }) {
  const ui = UI[lang];
  const pct = checkPct(questions, picks);
  const shown = useCountUp(pct);
  const ok = passed(pct);
  const right = questions.filter((q, k) => q.choices[picks[k]]?.best).length;
  const dots = questions.map((q, k) => (q.choices[picks[k]]?.best ? "bg-sd-accent-400" : "bg-white/20"));
  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="sd-a-in flex flex-col gap-[18px] rounded-2xl bg-sd-ink p-[22px] text-sd-bg">
        <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
          <div className="flex flex-col gap-1.5">
            <span className={clsx("text-[11px] font-extrabold tracking-[0.12em] uppercase", ok ? "text-sd-accent-400" : "text-sd-n-300")}>{ok ? ui.passed : ui.failed}</span>
            <span className="text-[88px] leading-[0.85] font-extrabold tracking-[-0.05em] lg:text-[104px]" aria-label={`${pct}%`}>{shown}%</span>
          </div>
          <span className="pb-1.5 text-[15px] font-bold whitespace-nowrap">{ui.of(right, questions.length)}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="relative grid grid-cols-5 gap-1">
            {dots.map((d, k) => <span key={k} className={clsx("h-1.5 rounded-full transition-colors duration-400", d)} />)}
            <span aria-hidden="true" className="absolute top-[-5px] left-[calc(60%-1px)] h-4 w-0.5 bg-sd-bg" />
          </div>
          <span className="text-xs text-sd-n-300">{ui.passMark(PASS)}</span>
        </div>
        <p className="m-0 max-w-[520px] text-[15px] leading-[1.45] text-pretty">{ok ? ui.passedBody(hasNext) : ui.failedBody}</p>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">{children}</div>
      </div>

      <section aria-label={ui.answers}>
        <h6 className="sd-h6 mb-2">{ui.answers}</h6>
        <ol className="m-0 flex list-none flex-col border-t-2 border-sd-divider p-0">
          {questions.map((q, k) => {
            const mine = q.choices[picks[k]];
            const best = q.choices.find((c) => c.best)!;
            const good = !!mine?.best;
            return (
              <li key={q.id} className="sd-a-in grid grid-cols-[28px_minmax(0,1fr)_28px] items-start gap-3 border-b border-sd-divider py-4" style={stagger(k, 70, 600)}>
                <span className="text-[13px] leading-7 font-extrabold text-sd-accent">{pad(k + 1)}</span>
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-base leading-[1.3] font-extrabold text-pretty">{q.prompt}</span>
                  {!good && <span className="text-[13px] text-sd-n-700"><b>{ui.yours}</b> · {mine ? mine.text : ui.skipped}</span>}
                  <div className="flex flex-col gap-1 rounded-lg bg-sd-surface px-3 py-2.5">
                    <span className="text-sm font-bold text-pretty">{best.text}</span>
                    <span className="text-[13px] leading-[1.5] text-sd-n-800 text-pretty">{best.why}</span>
                  </div>
                </div>
                <span className={clsx("flex size-7 items-center justify-center rounded-lg border-[1.5px]", good ? "border-sd-ink bg-sd-ink text-sd-bg" : "border-sd-divider text-sd-n-600")} aria-label={good ? "Correct" : "Wrong"}>
                  <Icon name={good ? "check" : "x"} size={14} stroke={good ? 3 : 2.5} />
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** Sends an attempt to be graded. The answers come back with it, or null when it couldn't be reached. */
async function grade(lesson: string, picks: number[]) {
  const res = await fetch("/api/sd/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson, picks: Array.from(picks, (p) => p ?? null) }),
  }).catch(() => null);
  const out = await res?.json().catch(() => null);
  return res?.ok && out?.review ? (out.review as Record<Lang, Question[]>) : null;
}

/**
 * The lesson check, in place of a plain "Prove it": an intro, five questions
 * with no feedback until the end, then the score and every answer explained.
 * 60% passes and unlocks the next lesson; a miss means rewatching first. The
 * lesson reaches the browser without its answers: the server grades the
 * attempt, keeps its own record, and sends the answers back for the results.
 */
export function LessonCheck({ s, act, id, questions, hasNext, onPass, onRewatch }: {
  s: CourseState; act: Act; id: string; questions: Question[]; hasNext: boolean;
  onPass: () => void; onRewatch: () => void;
}) {
  const ui = UI[s.lang];
  const p: LessonProgress = s.lessons[id] ?? {};
  const stage = s.checkStage;
  const tries = p.tries ?? 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** Opens the questions at the first one; the header counter and the locked step bar follow along. */
  const answer = () => act((q) => ({ ...q, checkStage: "q", checkIdx: 0, checkBusy: true }));
  const finish = async (picks: number[]) => {
    setBusy(true);
    setError("");
    const review = await grade(id, picks);
    setBusy(false);
    if (!review) return setError(ui.noGrade);
    act((q) => ({ ...updateLesson(submitCheck(q, id, review[q.lang], picks), id, { review }), checkStage: "result", checkBusy: false }));
  };

  if (stage === "q") {
    return <Questions questions={questions} lang={s.lang} idx={Math.min(s.checkIdx, questions.length - 1)} busy={busy} error={error} onIdx={(checkIdx) => act((q) => ({ ...q, checkIdx }))} onDone={finish} />;
  }

  if (stage === "passed" && p.post) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-extrabold">
          <span className="flex size-6 items-center justify-center rounded-md bg-sd-ink text-sd-bg"><Icon name="check" size={14} stroke={3} /></span>
          {ui.passedWith(p.check ?? checkPct(questions, p.post))}
        </span>
        <span className="flex flex-wrap gap-2">
          {p.review && <button type="button" onClick={() => act((q) => ({ ...q, checkStage: "result" }))} className="sd-btn sd-btn-ghost h-10">{ui.see}</button>}
          <button type="button" onClick={onPass} className="sd-btn sd-btn-secondary h-10 gap-2">{ui.continue}<Icon name="arrowR" size={16} /></button>
        </span>
      </div>
    );
  }

  if (stage === "result" && p.checkPicks && p.review) {
    const ok = !!p.post && !p.failed;
    return (
      <Results questions={p.review[s.lang]} lang={s.lang} picks={p.checkPicks} hasNext={hasNext}>
        {ok && <button type="button" onClick={() => { act((q) => ({ ...q, checkStage: "passed" })); onPass(); }} className="sd-btn h-[52px] w-full max-w-[320px] justify-between gap-3 rounded-[10px] bg-sd-accent-400 px-[18px] text-base text-sd-ink hover:bg-sd-accent-300">{ui.continue}<Icon name="arrowR" size={18} /></button>}
        {!ok && !p.rewatched && (
          <>
            <button type="button" onClick={onRewatch} className="sd-btn h-[52px] w-full max-w-[320px] justify-between gap-3 rounded-[10px] bg-sd-accent-400 px-[18px] text-base text-sd-ink hover:bg-sd-accent-300">{ui.rewatch}<Icon name="rotL" size={18} /></button>
            <span className="text-xs text-sd-n-300">{ui.rewatchFirst}</span>
          </>
        )}
        {!ok && p.rewatched && <button type="button" onClick={answer} className="sd-btn h-[52px] w-full max-w-[320px] justify-between gap-3 rounded-[10px] bg-sd-accent-400 px-[18px] text-base text-sd-ink hover:bg-sd-accent-300">{ui.retake}<Icon name="arrowR" size={18} /></button>}
        {tries > 1 && <span className="text-xs text-sd-n-300">{ui.tries(tries)}</span>}
      </Results>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-xl bg-sd-surface p-[18px]">
      <h3 className="m-0 text-[28px] leading-none tracking-[-0.035em] text-balance lg:text-[38px]">{ui.title}</h3>
      <div className="flex flex-wrap gap-2">
        <span className="sd-tag sd-tag-neutral rounded-md">{ui.count(assessmentParts(id, s.lang).total)}</span>
        <span className="sd-tag sd-tag-neutral rounded-md">{ui.time}</span>
        <span className="sd-tag sd-tag-accent rounded-md">{ui.mark}</span>
        <span className="sd-tag sd-tag-neutral rounded-md">{ui.answersEnd}</span>
      </div>
      <button type="button" onClick={answer} className="sd-btn sd-btn-primary h-[52px] justify-between text-base lg:w-[280px]">
        {p.failed ? ui.retake : ui.start}<Icon name="arrowR" size={18} />
      </button>
    </div>
  );
}
