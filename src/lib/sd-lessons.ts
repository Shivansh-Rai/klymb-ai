import { BUILT_LESSONS, FREE_LESSONS } from "@/data/system-design/course-app";
import { LESSON_DAYS, QUICK_CHECKS, TRANSCRIPTS } from "@/data/system-design/lessons";
import { SUBTITLES_EN } from "@/data/system-design/subtitles-en";
import type { Day, DayCopy, Lang, Question } from "@/data/system-design/types";
import { checkPct, passed, type LessonContent } from "@/lib/course-app";

/**
 * What of the course reaches a browser, and the grading that stays behind.
 * Server code only: this imports every lesson in full. It stays free of
 * "server-only" so the tests can run it; tests/sd-lessons.test.ts checks that
 * no client module imports it.
 */

/** A check with its answers taken out: the text to pick from, and nothing that says which is right. */
function redactCheck(questions: Question[]): Question[] {
  return questions.map((q) => ({ ...q, choices: q.choices.map((c) => ({ text: c.text, why: "" })) }));
}

function redactCopy(c: DayCopy): DayCopy {
  return { ...c, pre: [], post: redactCheck(c.post) };
}

/** A lesson as a browser may hold it. The check is graded by the server, so its answers stay here. */
export function redact(day: Day): Day {
  return { ...day, copy: { en: redactCopy(day.copy.en), hi: redactCopy(day.copy.hi) } };
}

export const isFreeLesson = (lesson: string) => FREE_LESSONS.includes(lesson);
export const isBuiltLesson = (lesson: unknown): lesson is string => typeof lesson === "string" && BUILT_LESSONS.includes(lesson);

/** The lessons a viewer may open: everything built with a seat, the free ones without. */
export function lessonContent(enrolled: boolean): Record<string, LessonContent> {
  const ids = enrolled ? BUILT_LESSONS : FREE_LESSONS;
  return Object.fromEntries(ids.map((id) => [id, {
    day: redact(LESSON_DAYS[id]),
    subtitles: { hinglish: TRANSCRIPTS[id] ?? [], en: SUBTITLES_EN[id] ?? [] },
    quickCheck: QUICK_CHECKS[id],
  }]));
}

/** Grades one attempt. Both languages hold the same answers in the same order, so either will do. */
export function gradeLesson(lesson: string, picks: (number | null)[]) {
  const pct = checkPct(LESSON_DAYS[lesson].copy.en.post, picks as number[]);
  return { pct, passed: passed(pct) };
}

/** The answers and explanations, sent back only once an attempt is in. */
export function lessonReview(lesson: string): Record<Lang, Question[]> {
  const { en, hi } = LESSON_DAYS[lesson].copy;
  return { en: en.post, hi: hi.post };
}

/** Only the course overview is free; every lesson video is in the paid course. */
export const isFreeVideo = (file: string) => /^overview[.-]/.test(file);
