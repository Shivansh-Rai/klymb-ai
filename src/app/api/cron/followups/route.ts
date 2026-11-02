import { isCronRequest } from "@/lib/cron-auth";
import { NextResponse } from "next/server";
import { site } from "@/data/config";
import { getTrack } from "@/data/tracks";
import { hasPaid } from "@/lib/access";
import { formatINR } from "@/lib/format";
import { dueFollowup, FOLLOWUP_DONE } from "@/lib/followups";
import { MAIL_SUPPORT, mailReady, noteEmail, sendMail } from "@/lib/mail";
import { normaliseEmail } from "@/lib/email";
import { followUpSdClaims } from "@/lib/sd-followups";
import { inviteSdPreregistrations } from "@/lib/sd-invites";
import { db } from "@/lib/db/client";
import { refreshCommitDays } from "@/lib/learner/commits";
import { LAUNCH_OFFER, offerOpen, priceNow } from "@/lib/offer";

/** At most this many per run: Brevo's free plan sends 300 a day. */
const BATCH = 60;

/**
 * Hourly (GitHub Actions, .github/workflows/followups.yml). Emails people who
 * registered for a paid track but haven't paid, 1 hour, 1 day and 3 days after
 * registering. Each step is claimed before sending, so a retried run never
 * sends it twice; paying, or a free track, ends the sequence. System Design
 * claims that weren't paid get the same three (lib/sd-followups). Requires
 * CRON_SECRET as a bearer token.
 *
 * On a local machine only, ?only=<email> runs just the System Design
 * follow-up for that one address, so a test mails nobody else.
 */
export async function GET(req: Request) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = db();
  if (!sql) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  // Housekeeping first, and before the Brevo gate, so it runs every hour
  // whether or not email is configured. It used to happen inside a random 1%
  // of user requests, where it scanned rate_limit_events in the middle of a
  // registration; here it is bounded, indexed and off the request path.
  const pruned = await sql.rows<{ task: string; result: number }>`
    select task, result from course.maintenance()
  `;
  if (pruned.error) console.error("maintenance failed:", pruned.error.message);

  // Commit counts for the admin learner table, refreshed a batch at a time so
  // this never competes with learners submitting work for GitHub's API budget.
  const commits = await refreshCommitDays(sql);

  if (!mailReady()) {
    return NextResponse.json({ maintenance: pruned.data ?? [], commits, sent: 0, skipped: "email not configured" });
  }

  const only = process.env.NODE_ENV !== "production" ? normaliseEmail(new URL(req.url).searchParams.get("only")) : null;
  // System Design claims that weren't paid: 1 hour, 1 day, 3 days.
  const sdFollowups = await followUpSdClaims(sql, new Date(), only);
  if (only) return NextResponse.json({ only, sdFollowups });

  // System Design pre-registrants: "it's open, your price is held", once each, when switched on.
  const sdInvites = await inviteSdPreregistrations(sql);

  const now = new Date();
  const { data: rows, error } = await sql.rows<{
    id: string; name: string | null; email: string; track: string; created_at: string; followup_stage: number;
  }>`
    select id, name, email, track, created_at, followup_stage
      from course.registrations
     where followup_stage < ${FOLLOWUP_DONE}
       and created_at <= ${new Date(now.getTime() - 3_600_000).toISOString()}
     order by created_at
     limit ${BATCH}
  `;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0, closed = 0;

  for (const r of rows ?? []) {
    const track = getTrack(r.track);
    // Free track, or already paid: the sequence is over.
    if (!track || track.price === 0 || (await hasPaid(r.email, r.track))) {
      await sql.run`update course.registrations set followup_stage = ${FOLLOWUP_DONE} where id = ${r.id}`;
      closed++;
      continue;
    }
    const step = dueFollowup(r.followup_stage, new Date(r.created_at), now);
    if (!step) continue;

    // Claim the step first: only the run that moves the stage sends the email.
    const { data: claimed } = await sql.row<{ id: string }>`
      update course.registrations
         set followup_stage = ${step}, followup_sent_at = ${now.toISOString()}
       where id = ${r.id} and followup_stage = ${r.followup_stage}
      returning id
    `;
    if (!claimed) continue;

    const mail = followupEmail(step, {
      name: String(r.name ?? "").split(" ")[0] || "there",
      trackName: track.name,
      becomes: track.becomes,
      price: priceNow(track.price, now),
      listPrice: track.price,
      offer: offerOpen(now),
    });
    const result = await sendMail({
      to: { email: r.email, name: r.name ?? undefined },
      ...mail,
      kind: `registration.followup.${step}`,
      idempotencyKey: `${r.id}:${step}`,
    });
    if (result.ok) sent++;
    else {
      console.error("follow-up failed:", r.id, step, result.reason);
      // A suppressed address won't take it on a retry either, so the claim stays.
      if (result.skipped) continue;
      // Release the claim so the next run can try again.
      await sql.run`
        update course.registrations set followup_stage = ${r.followup_stage}
         where id = ${r.id} and followup_stage = ${step}
      `;
    }
  }

  return NextResponse.json({ checked: rows?.length ?? 0, sent, closed, sdInvites, sdFollowups, maintenance: pruned.data ?? [], commits });
}

function followupEmail(
  step: 1 | 2 | 3,
  p: { name: string; trackName: string; becomes: string; price: number; listPrice: number; offer: boolean },
) {
  const price = p.offer ? `${formatINR(p.price)} (launch offer, was ${formatINR(p.listPrice)})` : formatINR(p.price);
  const offerLine = p.offer
    ? `Launch price: ${formatINR(LAUNCH_OFFER.price)} instead of ${formatINR(p.listPrice)}, until ${LAUNCH_OFFER.endsLabel}.`
    : "";
  const common = { siteUrl: site.url, supportEmail: MAIL_SUPPORT, eyebrow: p.trackName };
  const unlock = { title: "Unlock Days 2 to 30", body: `${price}. 100% back when you complete all 30 days.` };

  if (step === 1) {
    return noteEmail({
      ...common,
      subject: `Your Day 1 is ready, ${p.name}`,
      preview: "Day 1 is free. Start it today.",
      title: `Day 1 is waiting, ${p.name}.`,
      intro: `You registered for the ${p.trackName} track an hour ago. Day 1 is free and open now: one real problem, about 90 minutes, and you'll know exactly what the next 30 days feel like.`,
      heading: "How it works",
      points: [
        { title: "Start Day 1 free", body: "Sign in with Google using the email you registered with." },
        unlock,
        ...(offerLine ? [{ title: "Launch price", body: offerLine }] : []),
      ],
      cta: { href: `${site.url}/learn`, label: "Start Day 1 free" },
      closing: "Questions? Just reply to this email.",
    });
  }
  if (step === 2) {
    return noteEmail({
      ...common,
      subject: `${p.name}, one day in: here's what the 30 days build`,
      preview: `From ${p.trackName} to ${p.becomes}, with work you can show.`,
      title: "What you'll have after 30 days.",
      intro: `By Day 30 on the ${p.trackName} track you'll have a public portfolio a recruiter can open, four graded checkpoints and the most-asked interview questions practised: evidence for the move to ${p.becomes}.`,
      heading: "What's included",
      points: [
        { title: "30 real problems, one a day", body: "Work a team actually does, not videos to watch." },
        { title: "4 graded checkpoints", body: "Scored against a rubric, with written feedback." },
        { title: "Interview prep", body: "The most-asked questions for your role, with what a strong answer shows." },
        unlock,
      ],
      cta: { href: `${site.url}/pay`, label: "Unlock the full course" },
      closing: offerLine || "Day 1 stays free if you'd like to try it first.",
    });
  }
  return noteEmail({
    ...common,
    subject: p.offer ? `Last nudge: the ${formatINR(LAUNCH_OFFER.price)} launch price ends ${LAUNCH_OFFER.endsLabel}` : `Still thinking about the ${p.trackName} track?`,
    preview: "This is the last email we'll send about it.",
    title: "One last nudge.",
    intro: `This is the last email we'll send about it, ${p.name}. If the ${p.trackName} track isn't right for you now, no problem. If it is, the fastest way to decide is Day 1: it's free.`,
    heading: "Your options",
    points: [
      { title: "Try Day 1 free", body: "See the work before you pay anything." },
      unlock,
      ...(offerLine ? [{ title: "Launch price", body: offerLine }] : []),
    ],
    cta: { href: `${site.url}/learn`, label: "Try Day 1 free" },
    closing: "Got a question before you decide? Reply and a real person will answer.",
  });
}
