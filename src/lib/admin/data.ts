import "server-only";
import { getAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db/client";
import { SD_COURSE, referralDeadline } from "@/lib/sd-offer";
import type { TrackSlug } from "@/types/program";

export interface Registration {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  track: TrackSlug;
  job_role: string;
  experience: string;
  linkedin: string | null;
  cohort_start: string;
}

export interface LearnerProgress {
  id: string;
  name: string;
  email: string;
  track: TrackSlug;
  cohort_start: string;
  status: string;
  github_url: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  linkedin_slug: string | null;
  days_submitted: number;
  last_submission_at: string | null;
  /** The repo they submit from, and distinct days with their commits there (null: unknown). */
  commit_repo: string | null;
  commit_days: number | null;
  /** Checkpoint posts provided, out of the four due on days 7, 14, 21 and 28. */
  linkedin_posts: number;
  assessments_scored: number;
  latest_band: string | null;
}

export interface LearnerSubmission {
  day: number;
  deliverable_url: string | null;
  note: string | null;
  linkedin_post_url: string | null;
  quiz_answers: string[] | null;
  status: string;
  submitted_at: string;
  reviewer_note: string | null;
}

export interface LearnerDetail extends LearnerProgress {
  submissions: LearnerSubmission[];
}

export async function getRegistrations(): Promise<Registration[]> {
  // The connection has blanket read and write on the course schema, so
  // authorisation is checked here.
  if (!(await getAdmin())) return [];
  const sql = db();
  if (!sql) return [];
  const { data } = await sql.rows<Registration>`
    select id, created_at, name, email, phone, track, job_role, experience, linkedin, cohort_start
      from course.registrations
     order by created_at desc
     limit 1000
  `;
  return data ?? [];
}

export async function getLearnerProgress(): Promise<LearnerProgress[]> {
  if (!(await getAdmin())) return [];
  const sql = db();
  if (!sql) return [];

  const { data: learners } = await sql.rows<Omit<LearnerProgress, "days_submitted" | "last_submission_at" | "linkedin_posts" | "assessments_scored" | "latest_band">>`
    select id, name, email, track, cohort_start, status, github_url, linkedin_url,
           github_username, linkedin_slug, commit_repo, commit_days
      from course.learners
     order by created_at desc
  `;
  if (!learners?.length) return [];

  const ids = learners.map((l) => l.id);
  const [{ data: submissions }, { data: assessments }] = await Promise.all([
    sql.rows<{ learner_id: string; day: number; submitted_at: string; linkedin_post_url: string | null; deliverable_url: string | null }>`
      select learner_id, day, submitted_at, linkedin_post_url, deliverable_url
        from course.day_submissions where learner_id = any(${ids}::uuid[])
    `,
    sql.rows<{ learner_id: string; after_day: number; band: string | null; weighted_score: number | null }>`
      select learner_id, after_day, band, weighted_score
        from course.assessment_results where learner_id = any(${ids}::uuid[])
    `,
  ]);

  // Commit days are read, not fetched. They used to be counted here, one
  // commitDays() call per learner — and each of those makes up to three GitHub
  // requests, so this page alone could burn the whole hourly API budget that
  // checkFreshPush needs for learners to submit. The hourly cron refreshes
  // them now (src/lib/learner/commits.ts).
  return learners.map((l) => {
    const mine = submissions?.filter((s) => s.learner_id === l.id) ?? [];
    const scored = (assessments ?? [])
      .filter((a) => a.learner_id === l.id && a.weighted_score != null)
      .sort((a, b) => a.after_day - b.after_day);
    const last = mine.map((s) => s.submitted_at).sort().at(-1) ?? null;
    return {
      ...l,
      days_submitted: mine.length,
      linkedin_posts: mine.filter((s) => s.linkedin_post_url).length,
      last_submission_at: last,
      assessments_scored: scored.length,
      latest_band: scored.at(-1)?.band ?? null,
    } as LearnerProgress;
  });
}

export interface RegistrationSummary {
  total: number;
  last24h: number;
  last7d: number;
  byTrack: Record<string, number>;
}

/** Time-based rollups, computed outside component render. */
export function summariseRegistrations(rows: Registration[]): RegistrationSummary {
  const now = Date.now();
  const within = (days: number) => rows.filter((r) => now - new Date(r.created_at).getTime() < days * 864e5).length;
  return {
    total: rows.length,
    last24h: within(1),
    last7d: within(7),
    byTrack: rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.track]: (acc[r.track] ?? 0) + 1 }), {}),
  };
}

/** One learner, with every submission, for the reviewer's view. */
export async function getLearnerDetail(id: string): Promise<LearnerDetail | null> {
  if (!(await getAdmin())) return null;
  const sql = db();
  if (!sql) return null;

  const { data: learner } = await sql.row<LearnerProgress>`
    select id, name, email, track, cohort_start, status, github_url, linkedin_url, github_username, linkedin_slug
      from course.learners
     where id = ${id}
  `;
  if (!learner) return null;

  const [{ data: submissions }, { data: assessments }] = await Promise.all([
    sql.rows<LearnerSubmission>`
      select day, deliverable_url, note, linkedin_post_url, quiz_answers, status, submitted_at, reviewer_note
        from course.day_submissions
       where learner_id = ${id}
       order by day
    `,
    sql.rows<{ after_day: number; band: string | null; weighted_score: number | null }>`
      select after_day, band, weighted_score from course.assessment_results where learner_id = ${id}
    `,
  ]);

  const rows = submissions ?? [];
  const scored = (assessments ?? []).filter((a) => a.weighted_score != null).sort((a, b) => a.after_day - b.after_day);

  return {
    ...(learner as Omit<LearnerProgress, "days_submitted" | "linkedin_posts" | "last_submission_at" | "assessments_scored" | "latest_band">),
    days_submitted: rows.length,
    linkedin_posts: rows.filter((r) => r.linkedin_post_url).length,
    last_submission_at: rows.map((r) => r.submitted_at).sort().at(-1) ?? null,
    assessments_scored: scored.length,
    latest_band: scored.at(-1)?.band ?? null,
    submissions: rows,
  };
}

export interface PaymentRow {
  id: string;
  created_at: string;
  email: string;
  track: TrackSlug | typeof SD_COURSE;
  cohort_start: string;
  amount: number;
  status: "paid" | "refunded";
  razorpay_payment_id: string | null;
  /** The latest refund an admin asked Razorpay for, from the audit log. */
  refund_request: { by: string; at: string } | null;
  /** Whose link or code this order came through. */
  referred_by: string | null;
  /** Friends who count right now, or null when this payment holds no seat. */
  friends: number | null;
  referral_earned_at: string | null;
}

/** Completed payments only: unpaid orders are abandoned checkouts, not money. */
export async function getPayments(): Promise<PaymentRow[]> {
  if (!(await getAdmin())) return [];
  const sql = db();
  if (!sql) return [];
  const [{ data }, { data: log }, { data: seats }] = await Promise.all([
    sql.rows<Omit<PaymentRow, "refund_request" | "friends" | "referral_earned_at">>`
      select id, created_at, email, track, cohort_start, amount, status, razorpay_payment_id, referrer_email as referred_by
        from course.payments
       where status in ('paid', 'refunded')
       order by created_at desc
       limit 1000
    `,
    sql.rows<{ at: string; admin_email: string; details: { payment_id?: string; ok?: boolean } }>`
      select at, admin_email, details
        from course.admin_audit_log
       where action = 'payment.refund'
       order by at desc
       limit 1000
    `,
    sql.rows<{ payment_id: string; created_at: string; referral_earned_at: string | null; referrer_email: string | null; email: string }>`
      select e.payment_id, e.created_at, e.referral_earned_at, e.email, p.referrer_email
        from course.enrollments e
        join course.payments p on p.id = e.payment_id
       where e.status = 'active' and e.source = 'payment'
    `,
  ]);

  const seatByPayment = new Map((seats ?? []).map((seat) => [seat.payment_id, seat]));
  const friendsOf = (seat: { email: string; created_at: string }) =>
    (seats ?? []).filter((f) => f.referrer_email === seat.email && new Date(f.created_at).getTime() < referralDeadline(seat.created_at)).length;

  // Newest first, so the first accepted request per payment wins.
  const requests = new Map<string, { by: string; at: string }>();
  for (const e of log ?? []) {
    const id = e.details?.payment_id;
    if (id && e.details.ok && !requests.has(id)) requests.set(id, { by: e.admin_email, at: e.at });
  }

  return (data ?? []).map((p) => {
    const seat = seatByPayment.get(p.id);
    return {
      ...p,
      refund_request: (p.razorpay_payment_id && requests.get(p.razorpay_payment_id)) || null,
      friends: seat ? friendsOf(seat) : null,
      referral_earned_at: seat?.referral_earned_at ?? null,
    };
  });
}

export interface OverviewCounts {
  learners: { total: number; active: number; joinedLast7d: number; byTrack: Record<string, number> };
  /** Learners with at least one day submitted in the last 7 days. */
  submittingLast7d: number;
  money: { paid: number; paidAmount: number; refunded: number; refundedAmount: number };
}

/**
 * Plain counts for the overview, straight from the tables. Deliberately
 * not getLearnerProgress: that one asks GitHub about every learner, which is
 * right for the progress table and far too slow for the landing page.
 */
export async function getOverviewCounts(): Promise<OverviewCounts | null> {
  if (!(await getAdmin())) return null;
  const sql = db();
  if (!sql) return null;

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  // Counted in the database. These were `limit 5000` fetches that counted in
  // JavaScript, which is both slower and quietly wrong past 5000 rows: the
  // overview would have under-reported rather than failed.
  const [{ data: learners }, { data: byTrack }, { data: submitting }, { data: money }] = await Promise.all([
    sql.row<{ total: number; active: number; joined: number }>`
      select count(*)::int                                            as total,
             count(*) filter (where status = 'active')::int           as active,
             count(*) filter (where created_at >= ${weekAgo})::int    as joined
        from course.learners
    `,
    sql.rows<{ track: string; n: number }>`
      select track, count(*)::int as n from course.learners group by 1
    `,
    sql.scalar<number>`
      select count(distinct learner_id)::int from course.day_submissions where submitted_at >= ${weekAgo}
    `,
    sql.row<{ paid: number; paid_amount: number; refunded: number; refunded_amount: number }>`
      select count(*) filter (where status = 'paid')::int                        as paid,
             coalesce(sum(amount) filter (where status = 'paid'), 0)::int        as paid_amount,
             count(*) filter (where status = 'refunded')::int                    as refunded,
             coalesce(sum(amount) filter (where status = 'refunded'), 0)::int    as refunded_amount
        from course.payments
    `,
  ]);

  return {
    learners: {
      total: learners?.total ?? 0,
      active: learners?.active ?? 0,
      joinedLast7d: learners?.joined ?? 0,
      byTrack: Object.fromEntries((byTrack ?? []).map((t) => [t.track, t.n])),
    },
    submittingLast7d: submitting ?? 0,
    money: {
      paid: money?.paid ?? 0,
      paidAmount: money?.paid_amount ?? 0,
      refunded: money?.refunded ?? 0,
      refundedAmount: money?.refunded_amount ?? 0,
    },
  };
}
