import "server-only";
import { dayLockFor } from "@/lib/day-lock";
import { db } from "@/lib/db/client";

/**
 * Day 1 is free on every paid track; Days 2 to 30 need a paid seat. Free
 * tracks open everything. Fails open on a database error, so an outage never
 * locks a paying learner out.
 */
export async function hasPaid(email: string, track: string) {
  const sql = db();
  if (!sql) return true;
  // For this track only: paying for a cheaper track never unlocks a dearer one.
  const { data, error } = await sql.rows<{ id: string }>`
    select id from course.payments
     where email = ${email} and track = ${track} and status = 'paid'
     limit 1
  `;
  if (error) return true;
  return !!data?.length;
}

/** Postgres: the table isn't there. */
const UNDEFINED_TABLE = "42P01";

/**
 * Whether this email may open a course sold by enrolment. Fails open like
 * hasPaid, for the same reason: an outage never locks out someone who paid.
 * A missing table is not an outage: the migration hasn't run here, so nobody
 * holds a seat, and opening the course to everyone would give it away.
 */
export async function hasCourseAccess(email: string, course: string) {
  const sql = db();
  if (!sql) return true;
  const { data, error } = await sql.rows<{ id: string }>`
    select id from course.enrollments
     where email = ${email} and course = ${course} and status = 'active'
     limit 1
  `;
  if (error) return error.code !== UNDEFINED_TABLE;
  return !!data?.length;
}

export type { DayLock } from "@/lib/day-lock";

/** The day lock for a learner, with their payment looked up only when it matters. */
export async function dayLock({ email, track, price, day, submittedDays }: { email: string; track: string; price: number; day: number; submittedDays: number[] }) {
  const needsPayment = price > 0 && day > 1 && !submittedDays.includes(day);
  return dayLockFor({ day, price, paid: needsPayment ? await hasPaid(email, track) : true, submittedDays });
}
