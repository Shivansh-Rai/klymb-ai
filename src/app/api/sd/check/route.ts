import { NextResponse } from "next/server";
import { currentEmail } from "@/auth";
import { hasCourseAccess } from "@/lib/access";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { gradeLesson, isBuiltLesson, isFreeLesson, lessonReview } from "@/lib/sd-lessons";
import { SD_COURSE } from "@/lib/sd-offer";

const picksOf = (v: unknown) => (Array.isArray(v) && v.length <= 20 && v.every((p) => p === null || Number.isInteger(p)) ? (v as (number | null)[]) : null);

/**
 * Grades a lesson check. The lesson reaches the browser without its answers,
 * so this is the only place a score can come from. A signed-in attempt is
 * recorded, which is the proof "100% back on finishing" stands on. An attempt
 * signed out is graded but nothing is kept.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { lesson?: unknown; picks?: unknown } | null;
  const lesson = body?.lesson;
  const picks = picksOf(body?.picks);
  if (!isBuiltLesson(lesson) || !picks) return NextResponse.json({ error: "Unknown lesson." }, { status: 400 });

  const email = await currentEmail();
  if (!isFreeLesson(lesson) && !(email && (await hasCourseAccess(email, SD_COURSE)))) {
    return NextResponse.json({ error: "This lesson is in the full course." }, { status: 403 });
  }

  const limit = await checkRateLimit("sd_check", { limit: 60, windowMinutes: 60, identity: email ?? undefined });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const { pct, passed } = gradeLesson(lesson, picks);

  const sql = db();
  if (email && sql) {
    const { error } = await sql.run`
      insert into course.lesson_checks (email, course, lesson, best_score, passed_at)
      values (${email}, ${SD_COURSE}, ${lesson}, ${pct}, ${passed ? new Date().toISOString() : null})
      on conflict (email, course, lesson) do update
        set best_score = greatest(lesson_checks.best_score, excluded.best_score),
            attempts = lesson_checks.attempts + 1,
            passed_at = coalesce(lesson_checks.passed_at, excluded.passed_at),
            updated_at = now()
    `;
    // A grade the refund may rest on has to be on record: fail it rather than show a pass nobody kept.
    if (error) return NextResponse.json({ error: "Could not save your result. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ pct, passed, review: lessonReview(lesson) });
}
