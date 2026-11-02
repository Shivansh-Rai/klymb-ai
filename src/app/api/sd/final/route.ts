import { NextResponse } from "next/server";
import { currentEmail } from "@/auth";
import { QUESTIONS } from "@/data/system-design/course-app";
import { gradeFinal, type FinalAnswer } from "@/data/system-design/final";
import { hasCourseAccess } from "@/lib/access";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { SD_COURSE } from "@/lib/sd-offer";
import { paceOf } from "@/lib/sd-pace";
import { sdProgress } from "@/lib/sd-progress";

const isAnswer = (v: unknown) => v === null || typeof v === "number" || typeof v === "string" || (Array.isArray(v) && v.length <= 20 && v.every(Number.isInteger));
const answersOf = (v: unknown) =>
  Array.isArray(v) && v.length === QUESTIONS.length && v.every(isAnswer) && !v.some((a) => typeof a === "string" && a.length > 2000)
    ? v.map((a) => (a === null ? undefined : a)) as FinalAnswer[]
    : null;

/**
 * Grades the final assessment. Its answers stay on the server, and every try is
 * recorded, because the refund rests on it. `attempt` is the try the browser
 * thinks this is: sent twice, the second finds the first's row and returns it,
 * so a double submit costs one try.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { answers?: unknown; attempt?: unknown } | null;
  const answers = answersOf(body?.answers);
  const attempt = body?.attempt;
  if (!answers || !Number.isInteger(attempt) || (attempt as number) < 1) return NextResponse.json({ error: "Unknown attempt." }, { status: 400 });

  const email = await currentEmail();
  if (!email || !(await hasCourseAccess(email, SD_COURSE))) return NextResponse.json({ error: "The final assessment is in the full course." }, { status: 403 });

  const limit = await checkRateLimit("sd_final", { limit: 20, windowMinutes: 60, identity: email });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const sql = db();
  const before = await sdProgress(email, sql);
  if (!sql || !before) return NextResponse.json({ error: "Could not save your result. Please try again." }, { status: 500 });
  if (!paceOf(before).finalOpen) return NextResponse.json({ error: "The final assessment opens the day after you pass the last lesson." }, { status: 403 });
  if ((attempt as number) > before.finals.length + 1) return NextResponse.json({ error: "Unknown attempt." }, { status: 400 });

  const { results, score } = gradeFinal(answers);
  const { error } = await sql.run`
    insert into course.final_attempts (email, course, attempt, score, results)
    values (${email}, ${SD_COURSE}, ${attempt as number}, ${score}, ${results}::smallint[])
    on conflict (email, course, attempt) do nothing
  `;
  // A grade the refund may rest on has to be on record: fail it rather than show a score nobody kept.
  if (error) return NextResponse.json({ error: "Could not save your result. Please try again." }, { status: 500 });

  const { data: kept } = await sql.row<{ score: number; results: number[] }>`
    select score, results from course.final_attempts where email = ${email} and course = ${SD_COURSE} and attempt = ${attempt as number}
  `;
  const progress = await sdProgress(email, sql);
  return NextResponse.json({ score: kept?.score ?? score, results: kept?.results ?? results, progress });
}
