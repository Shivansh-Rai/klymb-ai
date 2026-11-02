import { NextResponse } from "next/server";
import { site } from "@/data/config";
import { LESSON_RELEASES } from "@/data/system-design/course-app";
import { lesson } from "@/lib/course-app";
import { isCronRequest } from "@/lib/cron-auth";
import { db } from "@/lib/db/client";
import { MAIL_SUPPORT, sdLessonOutEmail, sendMail } from "@/lib/mail";
import { SD_COURSE } from "@/lib/sd-offer";
import { addDays, istDay, paceOf } from "@/lib/sd-pace";
import { sdProgress } from "@/lib/sd-progress";

/**
 * Runs three times a day (GitHub Actions, .github/workflows/reminders.yml).
 * A learner waiting on a lesson has the day it comes out and the next to pass
 * it, so they have to hear about it: everyone whose next lesson went live
 * today or yesterday gets one email. Requires CRON_SECRET as a bearer token.
 */
export async function GET(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = db();
  if (!sql) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const today = istDay(Date.now());
  const fresh = Object.keys(LESSON_RELEASES).filter((id) => LESSON_RELEASES[id] === today || LESSON_RELEASES[id] === addDays(today, -1));
  if (!fresh.length) return NextResponse.json({ sent: 0 });

  const { data: seats, error } = await sql.rows<{ email: string; name: string | null }>`
    select e.email, l.name
      from course.enrollments e
      left join course.sd_preregistrations l on l.email = e.email
     where e.course = ${SD_COURSE} and e.status = 'active'
  `;
  if (error) return NextResponse.json({ error: "Could not read seats" }, { status: 500 });

  let sent = 0, failed = 0;
  for (const seat of seats ?? []) {
    const progress = await sdProgress(seat.email, sql);
    const pace = progress && paceOf(progress);
    // Day 1 has no deadline, and someone mid-way through older lessons isn't waiting on this one.
    if (!pace?.lesson || !fresh.includes(pace.lesson) || pace.day === 1) continue;
    const { data: claimed } = await sql.run`
      insert into course.sd_release_notices (email, lesson) values (${seat.email}, ${pace.lesson})
      on conflict (email, lesson) do nothing
    `;
    if (!claimed) continue;
    const mail = sdLessonOutEmail({
      name: seat.name ?? "there", day: pace.day, title: lesson(pace.lesson).title, refundable: pace.refundable,
      siteUrl: site.url, supportEmail: MAIL_SUPPORT,
    });
    const out = await sendMail({ to: { email: seat.email, name: seat.name ?? undefined }, ...mail, kind: "sd.lesson_out", idempotencyKey: `${seat.email}:${pace.lesson}` });
    if (out.ok) { sent++; continue; }
    // Not delivered: release the claim so the next run tries again.
    failed++;
    await sql.run`delete from course.sd_release_notices where email = ${seat.email} and lesson = ${pace.lesson}`;
  }
  return NextResponse.json({ sent, failed });
}
