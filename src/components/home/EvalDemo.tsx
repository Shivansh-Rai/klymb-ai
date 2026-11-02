"use client";

import clsx from "clsx";
import { useState } from "react";
import { evalMetrics } from "@/data/ai-foundations";
import { HIDE_MONEY } from "@/lib/site-status";
import { ButtonLink } from "@/components/ui/Button";

/*
 * Score one real-looking AI answer on the six metrics, then compare with an
 * expert. The answer is written to fail in instructive ways: a wrong number,
 * claims the source never makes, and a padded last sentence.
 */
const sample = {
  question: "What is the refund window for our annual plan?",
  source: "Annual plans can be refunded within 14 days of purchase. Monthly plans are not refundable.",
  answer:
    "You can get a full refund within 30 days on any plan. Just email support and they will process it within a week. Refunds are a great way to build trust, and most software companies offer them.",
};

const expert: Record<string, { score: number; why: string }> = {
  Correctness: { score: 1, why: "The window is 14 days, not 30, and monthly plans are not refundable at all." },
  Groundedness: { score: 1, why: "\"Email support\" and \"within a week\" appear nowhere in the source: the model made them up." },
  Relevance: { score: 4, why: "It is about refunds, as asked; it just gets them wrong." },
  Completeness: { score: 3, why: "It answers the window, but misses that the rule differs by plan." },
  Conciseness: { score: 2, why: "The last sentence is filler the customer did not ask for." },
  Safety: { score: 2, why: "It promises money the company will not pay: a real complaint and a real cost." },
};

export function EvalDemo() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const done = evalMetrics.every((m) => scores[m.name]);
  const gap = evalMetrics.reduce((sum, m) => sum + Math.abs((scores[m.name] ?? 0) - expert[m.name].score), 0);

  return (
    <div className="card mt-6 overflow-hidden rounded-slab">
      <div className="grid lg:grid-cols-[1fr_1.15fr]">
        <div className="bg-surface/60 p-7 sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-red-deep">Try it: grade an AI answer</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">Customer asks</dt>
              <dd className="mt-1 font-bold">{sample.question}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">Policy the AI was given</dt>
              <dd className="mt-1 rounded-lg border border-line/30 bg-card p-3">{sample.source}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">AI answer</dt>
              <dd className="mt-1 rounded-lg bg-night p-3 text-paper">{sample.answer}</dd>
            </div>
          </dl>
        </div>

        <div className="p-7 sm:p-10">
          <p className="text-sm text-muted">Score each metric from 1 (poor) to 5 (excellent).</p>
          <ul className="mt-4 divide-y divide-line/20 overflow-hidden rounded-card border border-line/25">
            {evalMetrics.map((m) => {
              const mine = scores[m.name];
              const theirs = expert[m.name];
              return (
                <li key={m.name} className="px-4 py-3 odd:bg-surface/50">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="w-28 text-sm font-extrabold">{m.name}</span>
                    <div role="radiogroup" aria-label={`${m.name} score`} className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={mine === n}
                          disabled={revealed}
                          onClick={() => setScores((s) => ({ ...s, [m.name]: n }))}
                          className={clsx(
                            "size-8 rounded-md border text-xs font-bold transition-colors nums",
                            mine === n ? "border-ink bg-ink text-paper" : "border-line/40 hover:border-ink",
                            revealed && theirs.score === n && "ring-2 ring-red ring-offset-1",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {revealed && (
                    <p className="mt-1.5 text-[13px] leading-snug text-muted">
                      <strong className="text-red-deep">Expert: {theirs.score}.</strong> {theirs.why}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {revealed ? (
              <>
                <p role="status" className="text-sm font-bold">
                  {gap <= 4 ? "You grade like a reviewer already." : gap <= 9 ? "Close. The course sharpens the rest." : "This is exactly what the course trains."}{" "}
                  <span className="font-normal text-muted">(total difference: {gap})</span>
                </p>
                <ButtonLink href={HIDE_MONEY ? "#register" : "#pricing"} arrow soft>Learn this in your track</ButtonLink>
                <button type="button" onClick={() => { setScores({}); setRevealed(false); }} className="text-sm font-bold text-red-deep underline underline-offset-4">
                  Try again
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!done}
                onClick={() => setRevealed(true)}
                className="rounded-lg bg-red-strong px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-press disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
              >
                {done ? "Compare with the expert" : `Score all six (${Object.keys(scores).length}/6)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
