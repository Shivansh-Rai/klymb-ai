import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { BUILT_LESSONS, MODULES } from "@/data/system-design/course-app";

/**
 * Who gets the 8 PM System Design reminder, and for what. Pure, so it is
 * unit-tested; /api/cron/sd-reminders only loads the rows and sends.
 *
 * The course is self-paced and lessons go live by being added to
 * BUILT_LESSONS, so nothing here has a date per lesson. "Missed today" means
 * an enrolled learner passed no lesson check today (IST). They are pointed at
 * the first lesson in course order that is out and not passed. Once every
 * lesson in the course is passed, the final assessment is the target. A
 * learner who has passed everything that is out is caught up and left alone,
 * and the day a new lesson ships they are due again, with no change here.
 *
 * Cadence, so a learner who has stepped away isn't mailed every night for
 * weeks: daily for the first three reminders in a row, then every third day,
 * then weekly from the tenth. Passing any lesson starts the count again.
 */

/** lesson_checks.lesson for the final assessment, once it is graded on the server. */
export const SD_FINAL_ASSESSMENT = "final";

export interface CourseLesson { id: string; title: string; minutes: number; position: number }

/** Every lesson in the course, built or not, in the order the course runs. */
export const COURSE_LESSONS: CourseLesson[] = MODULES.flatMap((m, mi) =>
  m.lessons.map(([title, duration], li) => ({ id: `${mi}-${li}`, title, minutes: minutesOf(duration), position: 0 })),
).map((l, i) => ({ ...l, position: i }));

/** "3:10" of video is roughly a 15-minute lesson once the check is in. Never below 10. */
function minutesOf(duration: string) {
  const [m, s] = duration.split(":").map(Number);
  const video = (m || 0) + (s || 0) / 60;
  return Math.max(10, Math.ceil((video + 10) / 5) * 5);
}

export function sdLessonCounts(built: readonly string[] = BUILT_LESSONS) {
  return { out: COURSE_LESSONS.filter((l) => built.includes(l.id)).length, total: COURSE_LESSONS.length };
}

/** Whole days from one "YYYY-MM-DD" to another. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5);
}

export interface ReminderLearner {
  /** IST date the seat opened. */
  enrolledOn: string;
  /** lesson → IST date its check was first passed. */
  passes: Map<string, string>;
  /** IST date of the last reminder, and how many in a row without a pass since. */
  remindedOn: string | null;
  streak: number;
}

export type ReminderTarget = { kind: "lesson"; lesson: CourseLesson } | { kind: "assessment" };

export interface ReminderPick {
  target: ReminderTarget;
  /** Lessons out and not passed, the target included. */
  behind: number;
  /** The streak to store once this one is sent. */
  streak: number;
}

/** The reminder this learner is due tonight, or null. */
export function pickSdReminder(l: ReminderLearner, today: string, built: readonly string[] = BUILT_LESSONS): ReminderPick | null {
  if (daysBetween(l.enrolledOn, today) < 1) return null; // the day they bought it isn't a missed day
  if (l.remindedOn && daysBetween(l.remindedOn, today) < 1) return null;

  const passedOn = [...l.passes.entries()].filter(([id]) => id !== SD_FINAL_ASSESSMENT).map(([, d]) => d);
  if (passedOn.includes(today)) return null;

  const open = COURSE_LESSONS.filter((x) => built.includes(x.id) && !l.passes.has(x.id));
  let target: ReminderTarget;
  if (open.length) target = { kind: "lesson", lesson: open[0] };
  else if (COURSE_LESSONS.every((x) => l.passes.has(x.id)) && !l.passes.has(SD_FINAL_ASSESSMENT)) target = { kind: "assessment" };
  else return null; // caught up on everything that is out, or finished

  // A pass on or after the last reminder means they came back: start counting again.
  const lastPass = passedOn.sort().at(-1);
  const streak = !l.remindedOn || (lastPass && lastPass >= l.remindedOn) ? 0 : l.streak;
  const gap = l.remindedOn ? daysBetween(l.remindedOn, today) : Infinity;
  const due = streak < 3 || (streak < 10 ? gap >= 3 : gap >= 7);
  if (!due) return null;

  return { target, behind: Math.max(1, open.length), streak: streak + 1 };
}

/*
 * Unsubscribe links. A token is the address and an HMAC over it, keyed from
 * AUTH_SECRET with its own derived key, so it can't be made for someone else
 * and needs no table. It never expires: an unsubscribe link should keep working.
 */

const unsubKey = (secret: string) => Buffer.from(hkdfSync("sha256", secret, "klymb.ai sd reminders", "unsubscribe", 32));
const macOf = (secret: string, email: string) => createHmac("sha256", unsubKey(secret)).update(email).digest();

export function unsubscribeToken(email: string, secret: string) {
  return `${Buffer.from(email).toString("base64url")}.${macOf(secret, email).toString("base64url")}`;
}

/** The address a token was made for, or null if it was altered or the secret changed. */
export function emailFromToken(token: unknown, secret: string | undefined): string | null {
  if (!secret || typeof token !== "string" || token.length > 600) return null;
  const [e, m] = token.split(".");
  if (!e || !m) return null;
  const email = Buffer.from(e, "base64url").toString("utf8");
  const given = Buffer.from(m, "base64url");
  const want = macOf(secret, email);
  return given.length === want.length && timingSafeEqual(given, want) ? email : null;
}
