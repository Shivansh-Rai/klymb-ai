import { QUESTIONS } from "./course-app";

/**
 * The final assessment's answers, in question order. Server code only: the
 * questions reach every browser, these must not, or a refund could be earned
 * by reading the page. tests/sd-final.test.ts checks no client module imports it.
 */
type Key = { ans: number } | { all: number[] } | { sequence: number[] } | { mentions: RegExp[] };

export const FINAL_KEY: Key[] = [
  { ans: 0 },
  { all: [0, 3] },
  { ans: 1 },
  { sequence: [2, 0, 4, 1, 3] },
  { mentions: [/consisten/, /availab/] },
  { ans: 1 },
];

export type FinalAnswer = number | number[] | string | undefined;

/** 1 if the answer is right. Short answers pass when they name what the key lists. */
export function gradeAnswer(key: Key, a: FinalAnswer): number {
  if ("ans" in key) return a === key.ans ? 1 : 0;
  if ("all" in key) return Array.isArray(a) && a.length === key.all.length && key.all.every((x) => a.includes(x)) ? 1 : 0;
  if ("sequence" in key) return Array.isArray(a) && a.length === key.sequence.length && key.sequence.every((v, i) => v === a[i]) ? 1 : 0;
  const t = (typeof a === "string" ? a : "").toLowerCase();
  return key.mentions.every((m) => m.test(t)) ? 1 : 0;
}

export function gradeFinal(answers: FinalAnswer[]) {
  const results = QUESTIONS.map((_, i) => gradeAnswer(FINAL_KEY[i], answers[i]));
  return { results, score: Math.round((results.reduce((a, b) => a + b, 0) / QUESTIONS.length) * 100) };
}
