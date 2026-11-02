import type { Metadata } from "next";
import Link from "next/link";
import { Mic } from "lucide-react";
import { signOutLearner } from "./actions";
import { auth } from "@/auth";
import { Appear } from "@/components/motion/Appear";
import { CohortBoard, type BoardDay } from "@/components/learner/CohortBoard";
import { EvidenceProfile } from "@/components/learner/EvidenceProfile";
import { Achievements } from "@/components/learner/Achievements";
import { LearnerTopBar } from "@/components/learner/LearnerTopBar";
import { PaymentNotice } from "@/components/learner/PaymentNotice";
import { StudyBuddy } from "@/components/learner/StudyBuddy";
import { hasPaid } from "@/lib/access";
import { dayLockFor } from "@/lib/day-lock";
import { ProgressRing } from "@/components/learner/ProgressRing";
import { CourseOfflineCache } from "@/components/pwa/CourseOfflineCache";
import { Wordmark } from "@/components/layout/Wordmark";
import { ButtonLink } from "@/components/ui/Button";
import { contact } from "@/data/config";
import { getTrack } from "@/data/tracks";
import { formatDate } from "@/lib/format";
import { topicsFor } from "@/lib/coach/topics";
import { requireLearner } from "@/lib/learner/data";
import { cohortDayDate } from "@/lib/learn";
import { getCurriculum } from "@/data/curricula";

export const metadata: Metadata = { title: "My cohort", robots: { index: false, follow: false } };

export default async function LearnHomePage() {
  const state = await requireLearner();

  if (state.state === "not-enrolled") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Wordmark className="text-2xl" />
        <h1 className="display mt-8 text-3xl">You are signed in, but not enrolled yet</h1>
        <p className="mt-3 text-muted">
          We could not find a course or cohort place for <strong className="text-ink">{state.email}</strong>. If you paid or
          registered with a different Google account, sign out and use that one: otherwise write to {contact.email} and we
          will sort it out.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/system-design" arrow>See System Design</ButtonLink>
          <ButtonLink href="/register?track=project-manager" variant="secondary">Register for the cohort</ButtonLink>
          <form action={signOutLearner}>
            <button type="submit" className="rounded-lg border border-line/50 px-5 py-3 text-sm font-bold hover:bg-ink hover:text-paper">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { learner, submissions } = state;
  const track = getTrack(learner.track)!;
  const session = await auth();

  // Each track has its own 30 days. A track whose course is not built yet
  // gets a holding page, never someone else's days.
  const curriculum = getCurriculum(learner.track);
  if (!track.contentLive || !curriculum) {
    return (
      <>
        <LearnerTopBar name={learner.name} image={session?.user?.image} />
        <PaymentNotice email={learner.email} track={track} />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-deep">{track.name} track</p>
          <h1 className="display mt-4 text-4xl text-balance">Your place is reserved. Day 1 opens soon.</h1>
          <p className="mt-4 text-muted">
            The {track.name} course is being finished for this cohort. We will email{" "}
            <strong className="text-ink">{learner.email}</strong> the moment Day 1 is ready: nothing is lost by waiting,
            and your 30 days start from that day.
          </p>
          <p className="mt-6 text-sm text-muted">
            Questions? <Link href={`mailto:${contact.email}`} className="font-semibold underline underline-offset-2">{contact.email}</Link>
          </p>
        </div>
      </>
    );
  }
  const doneDays = new Set(submissions.map((s) => s.day));
  const paid = track.price > 0 ? await hasPaid(learner.email, learner.track) : true;

  const days: BoardDay[] = curriculum.days.map((d) => ({
    day: d.day,
    week: d.week,
    weekName: curriculum.modules.find((m) => m.week === d.week)?.name ?? "",
    title: d.title,
    points: d.points,
    estimateMinutes: d.estimateMinutes,
    kind: d.kind,
    date: cohortDayDate(learner.cohort_start, d.day),
    submitted: doneDays.has(d.day),
    // Same rules as the day page: in order, and Days 2+ need a paid seat on a paid track.
    lock: ((l) => (l === "open" ? undefined : l))(dayLockFor({ day: d.day, price: track.price, paid, submittedDays: doneDays })),
  }));

  const nextDay = days.find((d) => !d.submitted) ?? days[days.length - 1];
  // Streak: consecutive submitted days counting back from the latest one done.
  let streak = 0;
  for (let d = Math.max(0, ...doneDays); d >= 1 && doneDays.has(d); d--) streak++;
  const firstName = learner.name.split(" ")[0] || "there";
  const buddyMessage =
    doneDays.size === days.length ? `All 30 days done, ${firstName}. Proud of you.`
    : doneDays.size === 0 ? `Hi ${firstName}, I'm Kamran. Day 1 is ready when you are.`
    : streak >= 3 ? `${streak} days in a row! Day ${nextDay.day} next.`
    : `Welcome back, ${firstName}. Day ${nextDay.day} is waiting.`;

  return (
    <>
      <LearnerTopBar name={learner.name} image={session?.user?.image} />
        <PaymentNotice email={learner.email} track={track} />

      {/* Deep red, lit from the top left and falling to near-black on the
          right; one soft glow drifts slowly behind the text. */}
      <div className="relative overflow-hidden bg-linear-to-br from-red via-red-press to-[#2a0204] text-white">
        <span aria-hidden="true" className="glow-drift pointer-events-none absolute -top-40 -left-24 size-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),transparent)]" />
        <div className="relative mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-8 sm:py-14">
          <div>
            <Appear y={10} className="mb-5">
              <StudyBuddy message={buddyMessage} />
            </Appear>
            <Appear y={14}>
              <h1 className="display text-[clamp(1.75rem,4vw,2.75rem)] uppercase">{track.name} cohort</h1>
            </Appear>
            <Appear y={14} delay={0.08}>
              <p className="display mt-2 text-[clamp(1.1rem,2.2vw,1.65rem)] uppercase text-white/80">
                {formatDate(learner.cohort_start)}
              </p>
            </Appear>
          </div>

          <Appear y={14} delay={0.12}>
            <ProgressRing done={doneDays.size} total={days.length} streak={streak} />
          </Appear>

          <Appear y={14} delay={0.16}>
            <div className="flex flex-wrap items-center gap-5 rounded-card bg-black/25 px-6 py-4 ring-1 ring-white/10 backdrop-blur-sm transition-[background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-black/30">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">
                  Up next · Day {nextDay.day}
                </p>
                <p className="mt-1 truncate text-lg font-extrabold">{nextDay.title}</p>
              </div>
              <ButtonLink href={`/learn/day/${nextDay.day}`} variant="inverse" arrow className="rounded-md px-5 py-2.5 text-xs">
                Open Day {nextDay.day}
              </ButtonLink>
            </div>
          </Appear>
        </div>
      </div>

      <CourseOfflineCache days={days.length} />
      <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-8">
        <Appear>
          <CohortBoard days={days} initialDay={nextDay.day} />
        </Appear>

        <Achievements days={days.filter((d) => d.submitted).length} name={learner.name} course={track.name} slug={learner.track} />

        {/* The spoken practice, where a learner will actually look for it:
            the course page they open every day, not a menu. */}
        {topicsFor(learner.track).length > 0 && (
          <Appear className="mt-12">
            <section className="flex flex-wrap items-center justify-between gap-5 rounded-card bg-night px-6 py-6 text-paper shadow-card">
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-red-soft">
                  <Mic className="size-5" />
                </span>
                <div>
                  <h2 className="display text-xl">Practise out loud, five minutes</h2>
                  <p className="mt-1 max-w-lg text-sm text-white/60">
                    The voice coach asks one question at a time on a single topic, and files what it heard for your reviewer.
                    Interviews are spoken: reading an answer is not practising it.
                  </p>
                </div>
              </div>
              <ButtonLink href="/learn/coach" variant="inverse" arrow className="rounded-md px-5 py-2.5 text-xs">
                Start a session
              </ButtonLink>
            </section>
          </Appear>
        )}

        <Appear className="mt-14">
          <section aria-labelledby="evidence">
            <EvidenceProfile
              githubUsername={learner.github_username}
              linkedinSlug={learner.linkedin_slug}
              githubUrl={learner.github_url}
              linkedinUrl={learner.linkedin_url}
            />
          </section>
          <p className="mt-8 text-xs text-muted">
            Questions about the cohort? <Link href={`mailto:${contact.email}`} className="underline underline-offset-2 hover:text-ink">{contact.email}</Link>
          </p>
        </Appear>
      </div>
    </>
  );
}
