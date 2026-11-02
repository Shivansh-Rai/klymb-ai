import { HIDE_MONEY } from "@/lib/site-status";
import type { Metadata } from "next";
import Link from "next/link";
import { Facts, LegalPage, Section } from "@/components/legal/LegalPage";
import { entity, grievance, entityRows, sdRefund } from "@/data/legal";
import { allFree, priceFrom, priceTo } from "@/data/tracks";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Klymb.ai and enrollment in a 30-day cohort.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your use of Klymb.ai and your place in a cohort. By registering or signing in, you accept them and the Privacy Policy."
    >
      <Section n="1." title="Who you are contracting with">
        <Facts
          rows={entityRows}
        />
      </Section>

      <Section n="2." title="Eligibility" plain="18 or over, and able to enter a contract.">
        <p>
          You must be at least 18 and able to form a binding agreement. If you register on behalf of an employer, you
          confirm you may bind them.
        </p>
      </Section>

      <Section n="3." title="Your account" plain="Sign in with Google, one account each, and you are responsible for what happens under it.">
        <ul>
          <li>You sign in with Google. Keep that account secure.</li>
          <li>One person, one account. Do not share access or submit work as someone else.</li>
          <li>You are responsible for activity under your account.</li>
          <li>We may suspend or end a place that breaches these terms.</li>
        </ul>
      </Section>

      <Section n="4." title="The programme" plain="30 days, four assessments and two days of interview prep, reviewed by a person. We may improve it as it runs.">
        <p>
          A cohort is 30 consecutive days of daily tasks, four weekly assessments, and two days of interview preparation, for one
          career track. Content, schedule and reviewers may change; we will not reduce the substance of {HIDE_MONEY ? "the programme" : "what you paid for"}.
        </p>
        <p>
          <strong>You cannot change track after you enroll.</strong> Each track has its own project, assessments and
          reviewer. If circumstances change, write to us and we will discuss options.
        </p>
      </Section>

      {!HIDE_MONEY && (
      <Section n="5." title="Fees and refunds" plain="One fee per track. Finish everything and you get all of it back.">
        <p>
          {allFree ? (
            <>Every course is currently free and no fee is taken. If fees return, they apply to one track and one cohort and are shown on each track&apos;s page and before you pay. </>
          ) : (
            <>The fee is for one track and one cohort, and depends on the track: from {formatINR(priceFrom)} to{" "}
          {formatINR(priceTo)}, shown on each track&apos;s page and before you pay. </>
          )}Free tracks, marked Free on their page, take no
          payment and so carry no refund. Complete a paid programme and we
          refund it in full. The conditions are in the <Link href="/refund-policy">Refund Policy</Link>, which forms part
          of these terms.
        </p>
      </Section>
      )}

      <Section n="5A." title="System Design" plain="One fee for the whole course, sold before every lesson is out. Finish all of it and you get the fee back.">
        <p>
          {sdRefund.earlyAccess} The price is shown before you pay, and you sign in with Google first: the account you pay
          with is the one that holds your seat, and a seat is for one person. The conditions for getting your fee back are in
          the <Link href="/refund-policy">Refund Policy</Link>, which forms part of these terms.
        </p>
      </Section>

      <Section n="6." title="What you submit" plain="Your work stays yours. We need permission to store, show and review it.">
        <p>
          You keep ownership of what you submit. You grant us a licence to store, display and process it to run the
          programme: reviewing and scoring, giving feedback, and showing it to your reviewer and administrators.
        </p>
        <p>
          Links you submit must be your own: your GitHub account, your LinkedIn posts. Submitting someone else&apos;s work
          as yours ends your place{HIDE_MONEY ? "" : " without refund"}.
        </p>
      </Section>

      <Section n="7." title="Honest work and AI use" plain="Use AI. Say so. Be able to defend everything you submit.">
        <p>
          You may use AI tools throughout the programme: that is part of what is taught. You must disclose that use in
          your log, and you must be able to explain any submission in your own words. Undisclosed AI use, fabricated
          evidence and invented numbers presented as measured are treated as dishonesty.
        </p>
      </Section>

      <Section n="8." title="Acceptable use">
        <ul>
          <li>Do not harass other learners, reviewers or staff.</li>
          <li>Do not scrape, attack or attempt unauthorised access to the service or other learners&apos; data.</li>
          <li>Do not submit unlawful content or anything confidential to an employer.</li>
          <li>Do not resell or republish programme materials.</li>
        </ul>
      </Section>

      <Section n="9." title="What we do not promise" plain="No job guarantee. Ever.">
        <p>
          <strong>
            Klymb.ai does not guarantee employment, interviews, placement, admission anywhere, or any salary outcome.
          </strong>{" "}
          Assessment scores and readiness reports describe your performance in this programme only, and are not a
          professional qualification, an accredited credential, or a recommendation to any employer.
        </p>
      </Section>

      <Section n="10." title="Our materials" plain="The curriculum and the platform are ours.">
        <p>
          The curriculum, assessments, briefs, platform and branding belong to {entity.registeredName}. You may use them
          for your own learning. You may not copy, resell or redistribute them.
        </p>
      </Section>

      <Section n="11." title="Service availability" plain="We aim to keep it running; we cannot promise perfection.">
        <p>
          The service is provided as is. We do not warrant uninterrupted or error-free operation. We will restore service
          as quickly as we reasonably can, and if an outage costs you a submission deadline, tell your reviewer: nobody
          {HIDE_MONEY ? "is marked down" : "loses a refund"} because our site was down.
        </p>
      </Section>

      <Section n="12." title="Limitation of liability" plain={HIDE_MONEY ? "Our liability is limited as far as the law allows." : "Our liability is capped at what you paid us."}>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental or consequential loss, or
          loss of profit or opportunity.{HIDE_MONEY ? "" : " Our total liability for any claim relating to the service is limited to the fee you paid us in the 12 months before the claim."}
        </p>
        <p>Nothing here limits liability that cannot be limited by law, including under consumer protection law.</p>
      </Section>

      <Section n="13." title="Ending your place">
        <p>
          {HIDE_MONEY ? (
            <>You may stop at any time. We may end a place for dishonesty, harassment, or serious breach of these terms.</>
          ) : (
            <>
              You may stop at any time; the refund position is in the <Link href="/refund-policy">Refund Policy</Link>. We may
              end a place for dishonesty, harassment, or serious breach of these terms, and where we do so for dishonesty the
              completion refund does not apply.
            </>
          )}
        </p>
      </Section>

      <Section n="14." title="Governing law and disputes" plain="Indian law. Talk to us first; we answer within 24 hours.">
        <p>
          These terms are governed by the laws of India, and the courts of Ghaziabad, Uttar Pradesh have jurisdiction,
          subject to consumer protections that cannot be waived. Before starting proceedings, please raise the matter
          with our Grievance Officer at <a href={`mailto:${grievance.email}`}>{grievance.email}</a> and allow 30 days to
          resolve it.
        </p>
      </Section>

      <Section n="15." title="Changes">
        <p>
          We may update these terms. The version and effective date are at the top. Your cohort is governed by the version
          in force when you enrolled, unless you accept a newer one. Material changes will be notified where we reasonably can.
        </p>
      </Section>
    </LegalPage>
  );
}
