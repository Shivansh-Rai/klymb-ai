import "server-only";
import { site } from "@/data/config";
import { type Db } from "@/lib/db/client";
import { formatINR } from "@/lib/format";
import { MAIL_SUPPORT, sdInviteEmail, sendMail } from "@/lib/mail";
import { SD_COURSE, SD_OFFER, offerPath, sdPriceFor } from "@/lib/sd-offer";
import { sdLessonCounts } from "@/lib/sd-reminders";

/** At most this many per run. The hourly follow-up job runs this, so a backlog clears within the day. */
const BATCH = 60;

/**
 * The "System Design is open, your price is held" mail, to people who
 * pre-registered before the course took payments. Those are the rows with
 * consent: the claim form that replaced pre-registration stores consent as
 * false, so it never adds to this list. Someone who has started a checkout
 * gets the unpaid-claim follow-ups (lib/sd-followups) instead, never both.
 *
 * Once each: a row is claimed by setting invited_at before the send, and
 * released only if the send fails. Off unless SD_INVITE_PREREGISTERED is
 * "true", so it goes out when the team decides, not on deploy.
 */
export async function inviteSdPreregistrations(sql: Db, env: Record<string, string | undefined> = process.env) {
  if (env.SD_INVITE_PREREGISTERED !== "true") return { sent: 0, skipped: "off" };

  const { data: rows, error } = await sql.rows<{ email: string; name: string; locked_price: number }>`
    select p.email, p.name, p.locked_price
      from course.sd_preregistrations p
     where p.consent and p.invited_at is null
       and not exists (
         select 1 from course.enrollments e
          where e.email = p.email and e.course = ${SD_COURSE} and e.status = 'active'
       )
       and not exists (
         select 1 from course.payments pay where pay.email = p.email and pay.track = ${SD_COURSE}
       )
     order by p.created_at
     limit ${BATCH}
  `;
  if (error) {
    console.error("sd invites: select failed:", error.code, error.message);
    return { sent: 0, error: error.message };
  }

  const lessons = sdLessonCounts();
  let sent = 0;
  for (const r of rows ?? []) {
    const { data: claimed } = await sql.row<{ email: string }>`
      update course.sd_preregistrations set invited_at = now()
       where email = ${r.email} and invited_at is null
      returning email
    `;
    if (!claimed) continue;

    const mail = sdInviteEmail({
      name: r.name.split(" ")[0] || "there",
      price: formatINR(sdPriceFor(r.locked_price)),
      full: formatINR(SD_OFFER.full),
      lessonsOut: lessons.out,
      lessonsTotal: lessons.total,
      url: `${site.url}${offerPath("prereg-invite")}`,
      siteUrl: site.url,
      supportEmail: MAIL_SUPPORT,
    });
    const result = await sendMail({ to: { email: r.email, name: r.name }, ...mail, kind: "sd.invite", idempotencyKey: r.email });
    if (result.ok) sent++;
    else {
      console.error("sd invite failed:", result.reason);
      if (!result.skipped) await sql.run`update course.sd_preregistrations set invited_at = null where email = ${r.email}`;
    }
  }
  return { sent, checked: rows?.length ?? 0 };
}
