import { HIDE_MONEY } from "@/lib/site-status";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal/LegalPage";
import { grievance, refund, sdRefund } from "@/data/legal";
import { allFree, priceFrom, priceTo } from "@/data/tracks";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Finish the course and we refund 100% of your fee. The conditions, in full.",
};

/** The course on sale. It stands alone while HIDE_MONEY keeps the 30-day tracks' fees off the site. */
function SystemDesignRefund({ n }: { n: string }) {
  return (
    <Section n={n} title="System Design" plain="Finish all 21 lessons, pass every check, take the final assessment: your fee comes back in full.">
      <p>{sdRefund.headline}</p>
      <p>{sdRefund.earlyAccess}</p>
      <p>All of the following must be true:</p>
      <ul>
        {sdRefund.conditions.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <p>{sdRefund.window}</p>
      <p>{sdRefund.payout}</p>
      <p>{sdRefund.partial}</p>
      <p>{sdRefund.forfeit}</p>
      <p>{sdRefund.duplicate}</p>
      <p>
        This refund is tied to finishing the course and nothing else. It is not a job guarantee. To claim, or if you
        disagree with a decision, write to <a href={`mailto:${grievance.email}`}>{grievance.email}</a>. We acknowledge
        within {grievance.acknowledgeWithin} and aim to resolve within {grievance.resolveWithin}. Nothing in this policy
        limits your rights under India&apos;s consumer protection law.
      </p>
    </Section>
  );
}

export default function RefundPolicyPage() {
  if (HIDE_MONEY) {
    return (
      <LegalPage title="Refund Policy" intro={sdRefund.headline}>
        <SystemDesignRefund n="1." />
      </LegalPage>
    );
  }
  return (
    <LegalPage
      title="Refund Policy"
      intro={refund.headline}
    >
      <SystemDesignRefund n="A." />
      {allFree && (
        <p className="mb-8 rounded-card bg-red-tint p-4 text-sm font-semibold text-ink">
          Every Klymb.ai course is free right now: no payment is taken, so there is nothing to refund. This policy applies to paid courses
          and to any payment made before courses became free.
        </p>
      )}
      <Section n="1." title="The guarantee" plain="Finish the programme and your fee comes back in full. Not most of it: all of it.">
        <p>
          If you complete the 30-day program, we refund <strong>100% of the fee you paid</strong>
          {allFree ? "." : <> (paid tracks are priced from {formatINR(priceFrom)} to {formatINR(priceTo)}).</>} The guarantee exists because the programme only works if you do the work, and
          we would rather be paid by people who did not finish than keep money from people who did.
        </p>
        <p>
          It is a genuine refund of the full amount, not credit, not points, and not a discount on a future cohort.
        </p>
      </Section>

      <Section n="2." title="What counts as completing" plain="Every day submitted, every assessment defended, both interview-prep days submitted, the four posts published, and a real commit history.">
        <p>All of the following must be true:</p>
        <ul>
          {refund.conditions.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <p>{refund.window}</p>
      </Section>

      <Section n="3." title="How and when you are paid" plain="Original payment method, within 14 working days of your Day 30.">
        <p>{refund.payout}</p>
        <p>
          You do not need to apply. Your reviewer confirms completion after Day 30 and we start the refund. If we think
          you have not met a condition, we will tell you which one and why before closing the matter, and you can dispute it.
        </p>
      </Section>

      <Section n="4." title="Where the guarantee does not apply" plain="Partial completion, and places ended for dishonesty.">
        <p>{refund.partial}</p>
        <p>{refund.forfeit}</p>
      </Section>

      <Section n="5." title="Cancelling before you start" plain="Change your mind before Day 1 and you get everything back, no questions.">
        <p>{refund.cancellation}</p>
      </Section>

      <Section n="6." title="If we cancel" plain="If we postpone or cancel your cohort, you choose: move to the next one, or take a full refund.">
        <p>
          If we do not run a cohort you have paid for: because it is postponed, cancelled, or does not reach the minimum
          size: you may move your place to the next cohort or take a full refund, whichever you prefer. Tell us which and
          we will process it within 14 working days.
        </p>
      </Section>

      <Section n="7." title="Disputes" plain="Write to our Grievance Officer. We reply within 24 hours and aim to resolve within 15 days.">
        <p>
          If you disagree with a refund decision, write to{" "}
          <a href={`mailto:${grievance.email}`}>{grievance.email}</a>. We acknowledge within{" "}
          {grievance.acknowledgeWithin} and aim to resolve within {grievance.resolveWithin}. Nothing in this policy
          limits your rights under India&apos;s consumer protection law, including your right to approach a consumer forum.
        </p>
        <p>
          Full entity and grievance details are at <Link href="/contact">/contact</Link>, and the programme terms at{" "}
          <Link href="/terms">/terms</Link>.
        </p>
      </Section>

      <Section n="8." title="What this is not" plain="A job guarantee. Finishing gets your money back: it does not get you hired.">
        <p>
          This refund is tied to your completion of the programme and nothing else. Klymb.ai does not guarantee
          employment, interviews, placement or any salary outcome, and no refund is owed on the basis of a job search result.
        </p>
      </Section>
    </LegalPage>
  );
}
