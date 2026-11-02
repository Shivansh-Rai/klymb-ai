import { isCronRequest } from "@/lib/cron-auth";
import { NextResponse } from "next/server";
import { site } from "@/data/config";
import { grievance } from "@/data/legal";
import { db } from "@/lib/db/client";
import { todayInIndia } from "@/lib/learn";
import { mailReady, sdReminderEmail, sendMail } from "@/lib/mail";
import { SD_COURSE } from "@/lib/sd-offer";
import { pickSdReminder, unsubscribeToken, type ReminderPick } from "@/lib/sd-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Sends in parallel, this many at a time. */
const CONCURRENCY = 8;
/** Before 18:00 IST "you haven't done today's lesson" isn't true yet. */
const EARLIEST_IST_HOUR = 18;

/**
 * 20:00 IST every day (GitHub Actions, .github/workflows/sd-reminders.yml).
 * Mails each System Design learner who passed no lesson check today: the next
 * lesson that is out, or the final assessment once every lesson is passed.
 * Who is due and how often is decided in lib/sd-reminders.
 *
 * Each reminder is claimed before it is sent (enrollments.reminded_on), so a
 * re-run never mails anyone twice in a day, and released if the send fails.
 * Requires CRON_SECRET as a bearer token.
 */
export async function GET(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = db();
  const secret = process.env.AUTH_SECRET;
  if (!sql || !secret) return NextResponse.json({ error: "Not configured" }, { status: 500 });
  if (!mailReady()) return NextResponse.json({ sent: 0, skipped: "email not configured" });

  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  // ?force=1 skips the hour, for testing on a local machine only.
  const force = process.env.NODE_ENV !== "production" && new URL(req.url).searchParams.get("force") === "1";
  if (hour < EARLIEST_IST_HOUR && !force) return NextResponse.json({ sent: 0, skipped: `before ${EARLIEST_IST_HOUR}:00 IST` });
  const today = todayInIndia();

  const { data: learners, error } = await sql.rows<{
    id: string; email: string; name: string | null; enrolled_on: string; reminded_on: string | null; reminder_streak: number;
  }>`
    select e.id, e.email, p.name,
           to_char(e.created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as enrolled_on,
           to_char(e.reminded_on, 'YYYY-MM-DD') as reminded_on,
           e.reminder_streak
      from course.enrollments e
      left join course.sd_preregistrations p on p.email = e.email
     where e.course = ${SD_COURSE} and e.status = 'active'
       and e.finished_at is null and e.reminders_off_at is null
       and (e.reminded_on is null or e.reminded_on < ${today}::date)
  `;
  // 42703: the columns aren't there, so 0021_sd_mail.sql hasn't run here.
  if (error) return NextResponse.json({ error: error.code === "42703" ? "Run npm run db:migrate (0021_sd_mail.sql)." : error.message }, { status: 500 });
  if (!learners?.length) return NextResponse.json({ checked: 0, sent: 0, today });

  const { data: checks, error: checksError } = await sql.rows<{ email: string; lesson: string; passed_on: string }>`
    select email, lesson, to_char(passed_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as passed_on
      from course.lesson_checks
     where course = ${SD_COURSE} and passed_at is not null
       and email = any(${learners.map((l) => l.email)}::text[])
  `;
  if (checksError) return NextResponse.json({ error: checksError.message }, { status: 500 });
  const passes = new Map<string, Map<string, string>>();
  for (const c of checks ?? []) passes.set(c.email, (passes.get(c.email) ?? new Map()).set(c.lesson, c.passed_on));

  const due: { learner: (typeof learners)[number]; pick: ReminderPick }[] = [];
  for (const l of learners) {
    const pick = pickSdReminder(
      { enrolledOn: l.enrolled_on, passes: passes.get(l.email) ?? new Map(), remindedOn: l.reminded_on, streak: l.reminder_streak },
      today,
    );
    if (pick) due.push({ learner: l, pick });
  }

  let sent = 0, failed = 0, suppressed = 0;
  const send = async ({ learner: l, pick }: (typeof due)[number]) => {
    const { data: claimed } = await sql.row<{ id: string }>`
      update course.enrollments set reminded_on = ${today}::date, reminder_streak = ${pick.streak}
       where id = ${l.id} and (reminded_on is null or reminded_on < ${today}::date)
      returning id
    `;
    if (!claimed) return;

    const lesson = pick.target.kind === "lesson" ? pick.target.lesson : null;
    const unsubscribeUrl = `${site.url}/api/sd/unsubscribe?t=${unsubscribeToken(l.email, secret)}`;
    const mail = sdReminderEmail({
      name: String(l.name ?? "").split(" ")[0] || "there",
      target: lesson ? { kind: "lesson", title: lesson.title, minutes: lesson.minutes, position: lesson.position } : { kind: "assessment" },
      behind: pick.behind,
      url: `${site.url}/learn/system-design${lesson ? `?lesson=${lesson.id}` : ""}`,
      unsubscribeUrl,
      siteUrl: site.url,
      supportEmail: grievance.email,
    });
    const result = await sendMail({
      to: { email: l.email, name: l.name ?? undefined },
      ...mail,
      kind: lesson ? "sd.reminder.lesson" : "sd.reminder.assessment",
      idempotencyKey: `${l.email}:${today}`,
      // One-click unsubscribe (RFC 8058), which Gmail and Yahoo expect on recurring mail.
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (result.ok) { sent++; return; }
    if (result.skipped) { suppressed++; return; }
    failed++;
    console.error("sd reminder failed:", l.id, result.reason);
    // Release the claim so a re-run tonight can try again.
    await sql.run`
      update course.enrollments set reminded_on = ${l.reminded_on}::date, reminder_streak = ${l.reminder_streak}
       where id = ${l.id} and reminded_on = ${today}::date
    `;
  };
  for (let i = 0; i < due.length; i += CONCURRENCY) await Promise.all(due.slice(i, i + CONCURRENCY).map(send));

  return NextResponse.json({ checked: learners.length, due: due.length, sent, suppressed, failed, today });
}
