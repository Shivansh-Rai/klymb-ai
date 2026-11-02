import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, currentEmail, verifiedEmailFrom } from "@/auth";
import { hasCourseAccess } from "@/lib/access";
import { db } from "@/lib/db/client";
import { checkDevice } from "@/lib/learner/device";
import { normaliseEmail } from "@/lib/email";
import { SD_COURSE } from "@/lib/sd-offer";
import type { TrackSlug } from "@/types/program";

export interface Learner {
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
}

export interface Submission {
  day: number;
  quiz_answers: string[] | null;
  linkedin_post_url: string | null;
  deliverable_url: string | null;
  note: string | null;
  status: string;
  submitted_at: string;
  reviewer_note: string | null;
}

export type LearnerState =
  | { state: "signed-out" }
  /** Signed in, but another device holds this learner's one device slot. */
  | { state: "other-device" }
  | { state: "not-enrolled"; email: string }
  | { state: "enrolled"; learner: Learner; submissions: Submission[] };

/**
 * Resolves the signed-in user to their cohort place.
 *
 * Identity is the Google-verified email on the session; the learner row is
 * matched on that email, so an enrolment created before their first sign-in
 * still finds them.
 */
export const getLearnerState = cache(async (): Promise<LearnerState> => {
  const session = await auth();
  const email = normaliseEmail(verifiedEmailFrom(session));
  if (!email) return { state: "signed-out" };
  // Sessions from before the one-device lock carry no device id: sign in again to claim one.
  if (!session?.user?.sid) return { state: "signed-out" };

  const sql = db();
  if (!sql) return { state: "signed-out" };

  // Exact match only: ownership of a cohort place must not be fuzzy.
  const { data: learner } = await sql.row<Learner & { device_session: string | null; device_seen_at: string | null }>`
    select id, name, email, track, cohort_start, status, github_url, linkedin_url,
           github_username, linkedin_slug, device_session, device_seen_at
      from course.learners
     where email = ${email}
  `;

  if (!learner) return { state: "not-enrolled", email };
  if (!(await checkDevice(learner, session?.user?.sid))) return { state: "other-device" };

  const { data: submissions } = await sql.rows<Submission>`
    select day, deliverable_url, note, status, submitted_at, reviewer_note, quiz_answers, linkedin_post_url
      from course.day_submissions
     where learner_id = ${learner.id}
     order by day
  `;

  return { state: "enrolled", learner: learner as Learner, submissions: submissions ?? [] };
});

/** Whoever bought System Design lives in that course for now, ahead of any cohort dashboard. */
export async function redirectCourseBuyer() {
  const email = await currentEmail();
  if (email && (await hasCourseAccess(email, SD_COURSE))) redirect("/learn/system-design");
}

export async function requireLearner() {
  await redirectCourseBuyer();
  const result = await getLearnerState();
  if (result.state === "signed-out") redirect("/learn/login");
  if (result.state === "other-device") redirect("/learn/login?error=device");
  return result;
}
