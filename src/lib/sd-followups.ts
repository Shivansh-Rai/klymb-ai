import "server-only";
import { site } from "@/data/config";
import { type Db } from "@/lib/db/client";
import { formatINR } from "@/lib/format";
import { FOLLOWUP_DONE, dueFollowup } from "@/lib/followups";
import { MAIL_SUPPORT, noteEmail, sendMail } from "@/lib/mail";
import { SD_COURSE, SD_OFFER, offerPath, sdPriceFor } from "@/lib/sd-offer";
import { sdLessonCounts } from "@/lib/sd-reminders";

/** At most this many per run. The hourly follow-up job runs this. */
const BATCH = 60;

/**
 * Follow-ups for a System Design claim that wasn't paid: the claim form was
 * filled in and Razorpay opened (there is an order), but no seat came of it.
 * 1 hour, 1 day and 3 days after the first order, the schedule the 30-day
 * tracks use (lib/followups), and only the latest due step on a late run.
 *
 * Any seat ends it, a refunded or revoked one too: nobody who paid hears
 * "finish your payment". Each step is claimed before the send and released
 * if the send fails, so a re-run never sends one twice.
 *
 * `only` limits a local test run to one address.
 */
export async function followUpSdClaims(sql: Db, now: Date = new Date(), only: string | null = null) {
  const { data: rows, error } = await sql.rows<{
    email: string; name: string; locked_price: number; followup_stage: number; started_at: string;
  }>`
    select p.email, p.name, p.locked_price, p.followup_stage, min(pay.created_at) as started_at
      from course.sd_preregistrations p
      join course.payments pay on pay.email = p.email and pay.track = ${SD_COURSE}
     where p.followup_stage < ${FOLLOWUP_DONE}
       and (${only}::text is null or p.email = ${only})
     group by p.email, p.name, p.locked_price, p.followup_stage
     order by started_at
     limit ${BATCH}
  `;
  if (error) {
    // 42703: 0023_sd_followups.sql hasn't run here yet.
    console.error("sd follow-ups: select failed:", error.code, error.message);
    return { sent: 0, error: error.code === "42703" ? "run 0023_sd_followups.sql" : error.message };
  }

  const lessons = sdLessonCounts();
  let sent = 0, closed = 0;
  for (const r of rows ?? []) {
    const { data: seat } = await sql.row<{ id: string }>`
      select id from course.enrollments where email = ${r.email} and course = ${SD_COURSE}
    `;
    if (seat) {
      await sql.run`update course.sd_preregistrations set followup_stage = ${FOLLOWUP_DONE} where email = ${r.email}`;
      closed++;
      continue;
    }
    const step = dueFollowup(r.followup_stage, new Date(r.started_at), now);
    if (!step) continue;

    const { data: claimed } = await sql.row<{ email: string }>`
      update course.sd_preregistrations
         set followup_stage = ${step}, followup_sent_at = ${now.toISOString()}
       where email = ${r.email} and followup_stage = ${r.followup_stage}
      returning email
    `;
    if (!claimed) continue;

    const mail = sdFollowupEmail(step, {
      name: r.name.split(" ")[0] || "there",
      price: formatINR(sdPriceFor(r.locked_price, now)),
      full: formatINR(SD_OFFER.full),
      lessonsOut: lessons.out,
      lessonsTotal: lessons.total,
      url: `${site.url}${offerPath(`sd-followup-${step}`, true)}`,
    });
    const result = await sendMail({
      to: { email: r.email, name: r.name },
      ...mail,
      kind: `sd.followup.${step}`,
      idempotencyKey: only ? `test:${r.email}:${step}:${now.getTime()}` : `${r.email}:${step}`,
    });
    if (result.ok) sent++;
    else {
      console.error("sd follow-up failed:", step, result.reason);
      // A suppressed address won't take it on a retry either, so the claim stays.
      if (!result.skipped) {
        await sql.run`
          update course.sd_preregistrations set followup_stage = ${r.followup_stage}
           where email = ${r.email} and followup_stage = ${step}
        `;
      }
    }
  }
  return { checked: rows?.length ?? 0, sent, closed };
}

function sdFollowupEmail(
  step: 1 | 2 | 3,
  p: { name: string; price: string; full: string; lessonsOut: number; lessonsTotal: number; url: string },
) {
  const common = { siteUrl: site.url, supportEmail: MAIL_SUPPORT, eyebrow: "System Design", title: `Hello ${p.name},` };
  const held = { title: "Your price is held", body: `${p.price} instead of ${p.full}, for as long as you need to decide.` };
  const refund = { title: "Finish it, get 100% back", body: "Pass every lesson's check and the final assessment, and we refund your whole fee." };
  const lessons = {
    title: "Lessons out now",
    body: p.lessonsOut >= p.lessonsTotal
      ? `All ${p.lessonsTotal} lessons are open.`
      : `${p.lessonsOut} of ${p.lessonsTotal} lessons are out. The rest are added as they are ready, at no extra cost.`,
  };

  if (step === 1) {
    return noteEmail({
      ...common,
      subject: "Your System Design seat is still held",
      preview: `Your payment didn't go through. Your ${p.price} price is still held.`,
      intro: `You started claiming your System Design seat, but the payment didn't go through. Nothing was charged, and your seat is still held at ${p.price}.`,
      heading: "Finish in two minutes",
      points: [
        { title: "Sign in with the same Google account", body: "Your answers are saved, so it goes straight to the payment." },
        held,
      ],
      cta: { href: p.url, label: "Finish my claim" },
      closing: "If the payment failed on your bank's side, trying again or another payment method usually works. Questions? Just reply to this email.",
    });
  }
  if (step === 2) {
    return noteEmail({
      ...common,
      subject: "What's inside System Design",
      preview: "Short lessons, a quick check each, and your fee back when you finish.",
      intro: "Here is what your System Design seat opens, so you can decide with everything in front of you.",
      heading: "What you get",
      points: [
        { title: "Short video lessons", body: "Real systems, explained simply, in English or Hinglish. A quick check after each one." },
        lessons,
        refund,
        held,
      ],
      cta: { href: p.url, label: "Claim my seat" },
      closing: "Questions before you decide? Reply and a real person will answer.",
    });
  }
  return noteEmail({
    ...common,
    subject: "A last note about your System Design seat",
    preview: "This is the last email we'll send about it.",
    intro: `This is the last email we'll send about it. If System Design isn't right for you now, no problem. If it is, your seat is still held at ${p.price}.`,
    heading: "Your seat",
    points: [held, refund],
    cta: { href: p.url, label: "Claim my seat" },
    closing: "Got a question first? Reply to this email.",
  });
}
