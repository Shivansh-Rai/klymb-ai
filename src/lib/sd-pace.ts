import { LESSON_RELEASES, MODULES } from "@/data/system-design/course-app";

/**
 * One day at a time, and the refund that rests on it. Pure, and safe in the
 * browser: the server decides with it and the app draws with it, so the two
 * can't disagree, and a tab left open past midnight still reads right. Days
 * are calendar days in India, whatever the learner's own clock says.
 *
 * Lesson n opens on max(day n-1 was passed + 1, its release) and is missed
 * after max(day n-1 was passed + 1, its release + 1). A day spent waiting for
 * a lesson that isn't out is nobody's fault, so it never counts as missed.
 */

/** The final's mark, and the tries that count towards the refund. Later tries are practice. */
export const FINAL_MARK = 70;
export const FINAL_TRIES = 3;

/** The day these rules began. Gaps before it were allowed at the time, so they can't count as misses. */
export const SD_PACE_FROM = "2026-11-03";

const LESSONS = MODULES.flatMap((m, mi) => m.lessons.map((_, li) => `${mi}-${li}`));

export interface LessonPass { lesson: string; at: string }
export interface FinalAttempt { attempt: number; score: number; at: string }

/** What the server holds on one learner. `refundable`: a paid seat whose fee hasn't already come back. */
export interface SdProgress { passes: LessonPass[]; finals: FinalAttempt[]; refundable: boolean }

export type PaceState =
  /** Nothing passed yet: Day 1 can start any day. */
  | "start"
  /** The next lesson can be passed today. */
  | "open"
  /** Passed today: the next step opens at midnight. */
  | "done"
  /** The next lesson isn't out yet. */
  | "waiting"
  /** All lessons passed and the final is open. */
  | "final"
  /** The final reached the mark. */
  | "finished";

export interface Pace {
  today: string;
  state: PaceState;
  /** The next lesson to pass, and its day number. Null once every lesson is passed. */
  lesson: string | null;
  day: number;
  passed: string[];
  /** Last day the next step counts on, when it has one. */
  dueOn: string | null;
  streak: number;
  longest: number;
  /** The first day that was missed. */
  missedOn: string | null;
  refund: "on-track" | "lost" | "earned";
  refundable: boolean;
  finalOpen: boolean;
  /** Tries left that still count towards the refund. */
  finalsLeft: number;
  finalBest: number | null;
}

/** The calendar day in India, as YYYY-MM-DD. */
export const istDay = (at: number | string | Date) => new Date(new Date(at).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const later = (a: string, b: string) => (a > b ? a : b);

interface PaceOptions { lessons?: string[]; releases?: Record<string, string>; from?: string }

export function paceOf(progress: SdProgress, now: number | Date = Date.now(), { lessons = LESSONS, releases = LESSON_RELEASES, from = SD_PACE_FROM }: PaceOptions = {}): Pace {
  const today = istDay(now);
  const passedOn = new Map(progress.passes.map((p) => [p.lesson, istDay(p.at)]));
  /** The day after which the lesson following one passed on `prev` is missed. */
  const dueAfter = (prev: string, release: string) => addDays(later(later(prev, from), release), 1);

  let i = 0, prev: string | null = null, run = 0, longest = 0;
  let missedOn: string | null = null;
  for (; i < lessons.length; i++) {
    const day = passedOn.get(lessons[i]);
    if (!day) break;
    if (prev) {
      const due = dueAfter(prev, releases[lessons[i]] ?? day);
      if (day > due) { missedOn ??= due; run = 0; }
    }
    longest = Math.max(longest, ++run);
    prev = day;
  }

  const lesson = lessons[i] ?? null;
  let state: PaceState, dueOn: string | null = null, won = false, failedFinal = false, finalOpen = false, finalsLeft = 0, finalBest: number | null = null;

  if (lesson) {
    const release = releases[lesson];
    const out = !!release && release <= today;
    if (!prev) state = out ? "start" : "waiting";
    else if (!out) state = "waiting";
    else if (today < addDays(prev, 1)) state = "done";
    else {
      state = "open";
      dueOn = dueAfter(prev, release);
      if (today > dueOn) { missedOn ??= dueOn; run = 0; }
    }
  } else {
    // Every lesson is passed. The final works like one more day: it opens the morning after and is due that day.
    dueOn = addDays(later(prev!, from), 1);
    finalOpen = today >= addDays(prev!, 1);
    const counted = progress.finals.filter((f) => f.attempt <= FINAL_TRIES && istDay(f.at) <= dueOn!);
    finalBest = counted.length ? Math.max(...counted.map((f) => f.score)) : null;
    won = finalBest !== null && finalBest >= FINAL_MARK;
    failedFinal = !won && counted.length >= FINAL_TRIES;
    finalsLeft = Math.max(0, FINAL_TRIES - counted.length);
    state = !finalOpen ? "done" : won ? "finished" : "final";
    if (!won && today > dueOn) { missedOn ??= dueOn; run = 0; finalsLeft = 0; }
  }

  return {
    today, state, lesson, day: i + 1, passed: lessons.slice(0, i).concat(lessons.slice(i).filter((id) => passedOn.has(id))), dueOn,
    streak: run, longest, missedOn,
    refund: missedOn || failedFinal ? "lost" : won ? "earned" : "on-track",
    refundable: progress.refundable, finalOpen, finalsLeft, finalBest,
  };
}

/** A lesson can be taken if it's already passed, or if it's the one open today. */
export const canTake = (p: Pace, id: string) => p.passed.includes(id) || (id === p.lesson && (p.state === "start" || p.state === "open"));

/** Why a lesson is shut, for the toast and the server's refusal. */
export function lockedMessage(p: Pace, id: string) {
  if (id === p.lesson && p.state === "done") return `Day ${p.day} opens at midnight India time. One day at a time.`;
  return `Finish Day ${p.day} first. One day at a time.`;
}

/** The line at the top of Home: where the learner stands today. */
export function paceMessage(p: Pace): { title: string; body: string; tone: "ok" | "warn" } {
  const keep = p.refundable ? "your streak and your refund" : "your streak";
  if (p.state === "finished") {
    if (p.refund === "earned" && p.refundable) return { title: "You finished on schedule.", body: "Your 100% refund is ready to claim.", tone: "ok" };
    return { title: "You finished the course.", body: `You scored ${FINAL_MARK}% or higher on the final assessment.`, tone: "ok" };
  }
  if (p.refund === "lost" && p.refundable) {
    if (p.state === "final" && !p.missedOn) return { title: "The refund is no longer available.", body: `You didn’t reach ${FINAL_MARK}% in ${FINAL_TRIES} tries. You can still retake the final assessment for practice.`, tone: "warn" };
    return { title: "You missed a day.", body: "Your streak has reset and the refund is no longer available. You can still finish the whole course.", tone: "warn" };
  }
  switch (p.state) {
    case "start": return { title: "Day 1 is ready when you are.", body: `Start any day you like. From then on it’s one lesson a day${p.refundable ? ", and a missed day ends the refund" : ""}.`, tone: "ok" };
    case "open": return { title: `Day ${p.day} is open.`, body: `Pass today’s check before midnight India time to keep ${keep}.`, tone: "ok" };
    case "done":
      if (!p.lesson) return { title: `Day ${p.day - 1} done. See you tomorrow.`, body: "The final assessment opens at midnight India time.", tone: "ok" };
      return { title: `Day ${p.day - 1} done. See you tomorrow.`, body: `Day ${p.day} opens at midnight India time.`, tone: "ok" };
    case "waiting": return { title: `Day ${p.day} isn’t out yet.`, body: `${p.refundable ? "Your streak and refund are" : "Your streak is"} safe. We’ll email you when it’s ready, and you’ll have until the end of the next day to pass it.`, tone: "ok" };
    case "final": return { title: "Final assessment today.", body: `Score ${FINAL_MARK}% or higher by midnight India time. You have ${p.finalsLeft} ${p.finalsLeft === 1 ? "try" : "tries"}.`, tone: "ok" };
  }
}
