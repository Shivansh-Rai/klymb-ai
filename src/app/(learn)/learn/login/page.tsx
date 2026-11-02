import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LearnerLoginForm } from "@/components/learner/LearnerLoginForm";
import { Wordmark } from "@/components/layout/Wordmark";
import { getLearnerState, redirectCourseBuyer } from "@/lib/learner/data";
import { inAppBrowser } from "@/lib/sd-offer";
import { continueOnThisDevice, signOutLearner } from "@/app/(learn)/learn/actions";

export const metadata: Metadata = { title: "Learner sign-in", robots: { index: false, follow: false } };

export default async function LearnerLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  await redirectCourseBuyer();
  const state = await getLearnerState();
  // Another device holds this learner's slot: stay here and explain, never loop back to /learn.
  const blocked = state.state === "other-device" || error === "device" || error === "takeover-limit";
  if (state.state !== "signed-out" && state.state !== "other-device") redirect("/learn");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark className="text-2xl" />
          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Learner sign-in</p>
        </div>
        <div className="card p-6 sm:p-8">
          {blocked ? (
            <>
              <h1 className="display text-2xl">Your account is open on another device</h1>
              <p className="mt-2 text-sm text-muted">
                Klymb works on one device at a time. Continue here and your other device will be signed out.
              </p>
              {error === "takeover-limit" ? (
                <p role="alert" className="mt-4 border-2 border-error bg-error-tint p-3 text-sm font-semibold text-error">
                  You&apos;ve switched devices several times today. Use the device you signed in on, or email{" "}
                  <a href="mailto:team@klymb.ai" className="underline underline-offset-2">team@klymb.ai</a>.
                </p>
              ) : state.state === "other-device" ? (
                <div className="mt-6 flex flex-col gap-3">
                  <form action={continueOnThisDevice}>
                    <button className="w-full rounded-full bg-red-strong py-3 text-sm font-bold text-white transition-[background-color,transform] duration-150 hover:bg-red-press active:scale-[0.97]">
                      Continue on this device
                    </button>
                  </form>
                  <form action={signOutLearner}>
                    <button className="w-full rounded-full py-2.5 text-sm font-semibold text-muted underline underline-offset-2 hover:text-ink">
                      Not now, sign out here
                    </button>
                  </form>
                </div>
              ) : null}
            </>
          ) : welcome ? (
            <>
              <h1 className="display text-2xl">One step to Day 1</h1>
              <p className="mt-2 text-sm text-muted">
                Your place is reserved. Create your sign-in with the <strong className="text-ink">same email you registered with</strong>:
                Google is quickest: and Day 1 opens straight away.
              </p>
            </>
          ) : (
            <>
              <h1 className="display text-2xl">Welcome back</h1>
              <p className="mt-2 text-sm text-muted">
                Log in with the Google account you paid or registered with. New here? See{" "}
                <Link href="/system-design" className="font-semibold underline underline-offset-2">System Design</Link> or the{" "}
                <Link href="/tracks" className="font-semibold underline underline-offset-2">30-day tracks</Link>.
              </p>
            </>
          )}
          {state.state !== "other-device" && (
            <LearnerLoginForm
              error={error && !blocked ? "Google sign-in did not complete. Please try again." : undefined}
              inApp={inAppBrowser((await headers()).get("user-agent") ?? "")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
