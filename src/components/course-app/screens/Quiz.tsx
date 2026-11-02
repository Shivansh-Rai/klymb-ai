"use client";

import clsx from "clsx";
import { DIAGRAMS, QUESTIONS, TIMED_SECONDS } from "@/data/system-design/course-app";
import { closeQuiz, isAnswered, nextQuestion, pad, paceNow, pickOption, setAnswer, type CourseState } from "@/lib/course-app";
import { FINAL_MARK, FINAL_TRIES } from "@/lib/sd-pace";
import { Icon } from "../icons";
import { BackButton, Bar, stagger } from "../ui";
import type { Act } from "../useCourseApp";

export function QuizIntro({ s, act }: { s: CourseState; act: Act }) {
  const pace = paceNow(s);
  const left = pace?.finalsLeft ?? FINAL_TRIES;
  const start = () => act((p) => ({ ...p, quiz: { ...p.quiz, stage: "q", idx: 0 }, timeLeft: TIMED_SECONDS }));
  return (
    <div className="sd-a-screen flex flex-1 max-w-[880px] flex-col lg:gap-5">
      <div className="px-3 pt-1 lg:p-0"><BackButton kind="close" onClick={() => act(closeQuiz)} /></div>
      <div className="flex flex-col gap-3.5 px-5 pt-2 lg:contents">
        <div className="sd-kicker text-sd-accent-700">The day after Day 21 · Whole course</div>
        <h1 className="m-0 text-[40px] leading-[1.02] tracking-[-0.03em] lg:text-[64px] lg:leading-[0.98] lg:tracking-[-0.04em]">Final assessment</h1>
        <p className="m-0 max-w-[620px] text-[15px] text-pretty text-sd-n-800 lg:text-[17px]">
          {QUESTIONS.length} questions across the whole course. {pace?.refund === "on-track" && pace.refundable
            ? `Score ${FINAL_MARK}% or higher today to keep your refund. You have ${left} ${left === 1 ? "try" : "tries"}, and your best score counts.`
            : "This try is for practice."} You’ll see how you did on each topic at the end, with the lesson to rewatch for anything you missed.
        </p>
        <div className="flex gap-2">
          <span className="sd-tag sd-tag-neutral">{QUESTIONS.length} questions</span>
          <span className="sd-tag sd-tag-neutral">About 8 min</span>
          <span className="sd-tag sd-tag-neutral">1 timed</span>
          <span className="sd-tag sd-tag-neutral">{FINAL_MARK}% to pass</span>
        </div>
      </div>
      <div className="mx-5 mt-[22px] border-t-2 border-sd-divider lg:mx-0 lg:mt-0 lg:grid lg:grid-cols-3 lg:border-l lg:border-l-sd-divider">
        {QUESTIONS.map((q, i) => (
          <div key={i} className="grid grid-cols-[32px_1fr_auto] items-center gap-2.5 border-b border-sd-divider py-[11px] lg:flex lg:flex-col lg:items-start lg:gap-1 lg:border-r lg:p-4">
            <span className="text-[18px] font-extrabold text-sd-accent">{pad(i + 1)}</span>
            <span className="text-sm font-semibold lg:text-[15px]">{q.typeLabel}</span>
            <span className="text-xs text-sd-n-700">{q.topic}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto px-5 py-4 lg:p-0">
        <button type="button" onClick={start} className="sd-btn sd-btn-primary sd-btn-block h-[52px] justify-between text-base lg:w-[280px]">Start assessment <Icon name="arrowR" /></button>
      </div>
    </div>
  );
}

function ChoiceOptions({ s, act, anim }: { s: CourseState; act: Act; anim: string }) {
  const q = QUESTIONS[s.quiz.idx];
  if (!("options" in q)) return null;
  const a = s.quiz.answers[s.quiz.idx];
  const multi = q.type === "multi";
  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-2.5" role={multi ? "group" : "radiogroup"}>
      {q.options.map((o, i) => {
        const sel = multi ? Array.isArray(a) && a.includes(i) : a === i;
        return (
          <button
            key={`${s.quiz.idx}-${i}`}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={sel}
            onClick={() => act((p) => pickOption(p, i))}
            className={clsx(anim, "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left text-[15px] hover:border-sd-accent lg:min-h-[72px] lg:gap-3.5 lg:p-4 lg:text-base", sel ? "border-sd-accent bg-sd-accent-100" : "border-sd-divider")}
            style={stagger(i, 60, 120)}
          >
            <span className={clsx("flex size-7 flex-none items-center justify-center border-[1.5px] text-[13px] font-extrabold lg:size-8 lg:text-sm", multi ? "rounded-md" : "rounded-full", sel ? "border-sd-accent bg-sd-accent text-sd-bg" : "border-sd-divider")}>
              {multi ? sel && <Icon name="check" size={14} stroke={3} /> : String.fromCharCode(65 + i)}
            </span>
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function DiagramOptions({ s, act, anim }: { s: CourseState; act: Act; anim: string }) {
  const a = s.quiz.answers[s.quiz.idx];
  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-3" role="radiogroup">
      {DIAGRAMS.map((dg, i) => {
        const sel = a === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-label={`${String.fromCharCode(65 + i)}: ${dg.caption}`}
            onClick={() => act((p) => setAnswer(p, i))}
            className={clsx(anim, "flex min-h-[200px] cursor-pointer flex-col items-center rounded-lg border-2 px-1.5 pt-2.5 pb-3 hover:border-sd-accent lg:min-h-[260px] lg:px-3 lg:pt-3.5 lg:pb-4", sel ? "border-sd-accent bg-sd-accent-100" : "border-sd-divider")}
            style={stagger(i, 80, 120)}
          >
            <span className={clsx("mb-2.5 self-start text-sm font-extrabold lg:mb-4 lg:text-lg", sel && "text-sd-accent")}>{String.fromCharCode(65 + i)}</span>
            {dg.rows.map((row, ri) => (
              <div key={ri} className="flex flex-col items-center">
                {ri > 0 && <div className="h-3.5 w-0.5 bg-sd-ink lg:h-5" />}
                <div className="flex gap-1 lg:gap-2">
                  {row.map((n) => (
                    <div key={n} className={clsx("min-w-10 rounded-xl border-[1.5px] border-sd-ink px-[5px] py-1.5 text-[10px] font-extrabold lg:min-w-16 lg:border-2 lg:px-3 lg:py-[9px] lg:text-[13px]", ri === 0 ? "bg-sd-ink text-sd-bg" : "bg-sd-bg")}>{n}</div>
                  ))}
                </div>
              </div>
            ))}
            <span className="mt-auto self-start pt-2.5 text-left text-[11px] text-sd-n-700 lg:pt-3.5 lg:text-[13px]">{dg.caption}</span>
          </button>
        );
      })}
    </div>
  );
}

function OrderSteps({ s, act, anim }: { s: CourseState; act: Act; anim: string }) {
  const q = QUESTIONS[s.quiz.idx];
  if (q.type !== "order") return null;
  const a = s.quiz.answers[s.quiz.idx];
  const order = Array.isArray(a) ? a : q.start;
  const move = (i: number, j: number) => {
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    act((p) => setAnswer(p, o));
  };
  return (
    <div className="flex flex-col gap-2 lg:max-w-[640px]">
      <div className="text-xs text-sd-n-700 lg:text-[13px]">Use the arrows to move each step.</div>
      {order.map((v, i) => (
        <div key={v} className={clsx(anim, "grid grid-cols-[28px_1fr_40px_40px] items-center gap-1.5 rounded-xl border-2 border-sd-divider bg-sd-surface py-1.5 pr-1.5 pl-3 lg:grid-cols-[32px_1fr_40px_40px] lg:gap-2 lg:pl-3.5")} style={stagger(i, 50, 120)}>
          <span className="text-base font-extrabold text-sd-accent lg:text-lg">{i + 1}</span>
          <span className="text-sm leading-[1.3] lg:text-[15px]">{q.items[v]}</span>
          <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="sd-btn sd-btn-secondary sd-btn-icon size-10"><Icon name="up" size={16} /></button>
          <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label="Move down" className="sd-btn sd-btn-secondary sd-btn-icon size-10"><Icon name="down" size={16} /></button>
        </div>
      ))}
    </div>
  );
}

export function QuizQuestion({ s, act }: { s: CourseState; act: Act }) {
  const { idx, answers } = s.quiz;
  const q = QUESTIONS[idx];
  const a = answers[idx];
  const sending = s.quiz.stage === "sending";
  // Alternating the keyframe name restarts the slide-in on every new question.
  const anim = idx % 2 ? "sd-a-side" : "sd-a-side-b";
  const last = idx === QUESTIONS.length - 1;
  const text = typeof a === "string" ? a : "";

  return (
    <div className="sd-a-screen flex flex-1 max-w-[880px] flex-col lg:gap-5">
      <div className="flex items-center gap-2 px-3 pt-1 pb-2 lg:gap-4 lg:p-0">
        <BackButton kind="close" onClick={() => act(closeQuiz)} />
        <span className="flex-1 text-xs font-semibold tracking-[0.08em] uppercase">Final assessment</span>
        <span className="pr-2 text-[17px] font-extrabold lg:p-0 lg:text-lg">{idx + 1} / 6</span>
      </div>
      <div className="grid grid-cols-6 gap-[3px] px-5 lg:gap-1 lg:px-0" aria-hidden="true">
        {QUESTIONS.map((_, i) => <div key={i} className={clsx("h-[5px] rounded-full transition-colors duration-400 lg:h-1.5", i < idx ? "bg-sd-accent" : i === idx ? "bg-sd-ink" : "bg-sd-n-300")} />)}
      </div>
      <div className="flex flex-col gap-3 px-5 pt-5 lg:contents">
        <div className="flex gap-1.5 lg:mt-2"><span className="sd-tag sd-tag-accent font-semibold">{q.typeLabel}</span><span className="sd-tag sd-tag-neutral">{q.topic}</span></div>
        {q.type === "timed" && (
          <div className="flex items-center gap-2.5 lg:max-w-[520px] lg:gap-3" role="timer" aria-label={`${s.timeLeft} seconds left`}>
            <span className="flex text-sd-accent"><Icon name="clock" /></span>
            <Bar value={(s.timeLeft / TIMED_SECONDS) * 100} className="h-1.5 flex-1" fillClass="bg-sd-accent transition-[width]! duration-1000! ease-linear" />
            <span className="min-w-9 text-xl font-extrabold lg:min-w-11 lg:text-2xl">{s.timeLeft}s</span>
          </div>
        )}
        <h3 key={idx} className={clsx(anim, "m-0 max-w-[760px] text-[22px] leading-[1.2] tracking-[-0.015em] text-pretty lg:text-[32px] lg:leading-[1.15] lg:tracking-[-0.02em]")}>{q.prompt}</h3>
      </div>
      <div className="flex flex-col gap-2 px-5 pt-[18px] pb-5 lg:contents">
        {"options" in q && <ChoiceOptions s={s} act={act} anim={anim} />}
        {q.type === "diagram" && <DiagramOptions s={s} act={act} anim={anim} />}
        {q.type === "order" && <OrderSteps s={s} act={act} anim={anim} />}
        {q.type === "text" && (
          <div className="flex flex-col gap-2 lg:max-w-[640px] lg:gap-1.5">
            <textarea className="sd-input min-h-[140px] text-[15px] lg:text-base" aria-label="Your answer" value={text} onChange={(e) => act((p) => setAnswer(p, e.target.value))} placeholder="Type your answer in a sentence or two" />
            <div className="text-xs text-sd-n-700">{text.length} characters</div>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 mt-auto flex gap-2 border-t-2 border-sd-divider bg-sd-bg px-5 pt-3 pb-4 lg:px-0 lg:pt-4 lg:pb-0">
        <button type="button" onClick={() => act(nextQuestion)} disabled={sending} className="sd-btn sd-btn-secondary h-[52px] w-24 justify-start lg:h-12 lg:w-[110px]">Skip</button>
        <button type="button" onClick={() => act(nextQuestion)} disabled={sending || !isAnswered(q, a)} className="sd-btn sd-btn-primary h-[52px] flex-1 justify-between text-base lg:h-12 lg:w-[220px] lg:flex-none">
          {sending ? "Grading…" : last ? "Finish" : "Next"}<Icon name="arrowR" />
        </button>
        <span className="ml-auto hidden self-center text-xs text-sd-n-700 lg:inline">Press 1–4 to answer · Enter for next</span>
      </div>
    </div>
  );
}
