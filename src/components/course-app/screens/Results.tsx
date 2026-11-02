"use client";

import clsx from "clsx";
import { QUESTIONS, REVIEW_LESSON } from "@/data/system-design/course-app";
import { isSoon, lesson, lessonDay, openLesson, paceNow, pct, startQuiz, type CourseState } from "@/lib/course-app";
import { FINAL_MARK } from "@/lib/sd-pace";
import { Icon } from "../icons";
import { BackButton, stagger, useCountUp } from "../ui";
import type { Act } from "../useCourseApp";

function Mark({ ok }: { ok: boolean }) {
  return (
    <span className={clsx("flex size-[26px] items-center justify-center rounded-lg border-[1.5px] lg:size-7", ok ? "border-sd-ink bg-sd-ink text-sd-bg" : "border-sd-divider text-sd-n-600")}>
      {ok ? <Icon name="check" size={14} stroke={3} /> : <Icon name="x" size={14} stroke={2.5} />}
    </span>
  );
}

/** The final assessment's results. Lesson checks show their own results inside the lesson. */
export function Results({ s, act }: { s: CourseState; act: Act }) {
  const res = s.post ?? [];
  const resPct = parseInt(pct(res), 10) || 0;
  const shown = useCountUp(resPct);
  const recs = QUESTIONS.map((q, i) => ({ q, i }))
    .filter((x) => !res[x.i])
    .slice(0, 3)
    .map(({ q }) => {
      const id = REVIEW_LESSON[q.topic];
      return { id, topic: q.topic, l: lesson(id), soon: isSoon(id) };
    });
  const close = () => act((p) => ({ ...p, screen: "home", tab: "home" }));
  const pace = paceNow(s);
  const reached = resPct >= FINAL_MARK;
  // Tries that still count come first; after those, and after the day, it's practice.
  const again = pace?.state === "final";
  const left = pace?.finalsLeft ?? 0;
  const cta = again ? () => act((p) => startQuiz(p, "post")) : close;
  const ctaLabel = !again ? "Back to home" : left ? `Try again · ${left} ${left === 1 ? "try" : "tries"} left` : "Retake for practice";
  const verdict = pace?.refund === "earned" && pace.refundable
    ? `You reached ${FINAL_MARK}%. Your 100% refund is ready to claim.`
    : reached ? `You reached the ${FINAL_MARK}% mark.` : `${FINAL_MARK}% is the mark.`;

  const recList = recs.length > 0 && (
    <div className="mx-5 mt-[22px] lg:mx-0 lg:mt-3">
      <h6 className="sd-h6 mb-2">Still worth reviewing</h6>
      <div className="border-t-2 border-sd-divider">
        {recs.map((r) => (
          <button key={r.topic} type="button" disabled={r.soon} onClick={() => act((p) => openLesson(p, r.id))} className="grid w-full cursor-pointer grid-cols-[56px_1fr_18px_18px] items-center gap-2.5 rounded-lg border-b border-sd-divider py-[11px] text-left hover:bg-sd-accent-100 disabled:cursor-default disabled:hover:bg-transparent">
            <span className="text-[13px] font-extrabold text-sd-accent">{lessonDay(r.id)}</span>
            <span className="flex flex-col"><span className="text-sm font-semibold">{r.l.title}</span><span className="text-xs text-sd-n-700">{r.topic} · {r.soon ? "coming soon" : r.l.dur}</span></span>
            <span className="flex text-sd-accent"><Icon name="play" size={16} /></span>
            <span className="flex text-sd-n-600"><Icon name="chevR" size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sd-a-screen flex flex-1 max-w-[1040px] flex-col lg:flex-1 lg:gap-5">
      <div className="px-3 pt-1 lg:p-0"><BackButton kind="close" onClick={close} /></div>
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-[22px]">
        <div className="flex flex-col lg:gap-2.5">
          <div className="px-5 pt-1 lg:contents">
            <div className="sd-kicker text-sd-accent-700">Final assessment results</div>
            <div className="mt-1.5 text-[104px] leading-[0.9] font-extrabold tracking-[-0.05em] lg:mt-0 lg:text-[160px] lg:leading-[0.85]" aria-label={`${resPct}%`}>{shown}%</div>
            <div className="mt-2.5 text-[16px] lg:mt-0 lg:text-[17px]">{res.reduce((x, y) => x + y, 0)} of {QUESTIONS.length} correct. {verdict}</div>
          </div>
          <div className="hidden lg:block">{recList}</div>
        </div>
        <div className="lg:hidden">{recList}</div>
        <div className="mx-5 mt-[22px] lg:mx-0 lg:mt-0">
          <div className="grid grid-cols-[1fr_64px] gap-2 border-b-2 border-sd-divider pb-2 text-[11px] tracking-[0.08em] text-sd-n-700 uppercase lg:grid-cols-[1fr_72px]">
            <span>Topic</span><span>Result</span>
          </div>
          {QUESTIONS.map((q, i) => (
            <div key={q.topic} className="sd-a-in grid grid-cols-[1fr_64px] items-center gap-2 border-b border-sd-divider py-2.5 lg:grid-cols-[1fr_72px] lg:py-[13px]" style={stagger(i, 70, 600)}>
              <span className="text-sm font-semibold lg:text-[15px]">{q.topic}</span>
              <Mark ok={!!res[i]} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto hidden pt-6 lg:block">
        <button type="button" onClick={cta} className="sd-btn sd-btn-primary h-[52px] w-full max-w-[280px] justify-between text-base">{ctaLabel}<Icon name="arrowR" /></button>
      </div>
      <div className="mt-auto flex flex-col gap-2 px-5 py-4 lg:hidden">
        <button type="button" onClick={cta} className="sd-btn sd-btn-primary sd-btn-block h-[52px] justify-between text-base">{ctaLabel}<Icon name="arrowR" /></button>
      </div>
    </div>
  );
}
