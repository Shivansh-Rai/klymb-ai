"use client";

import { signInLearner } from "@/app/(learn)/learn/actions";
import { useEffect, useState } from "react";
import { GoogleMark } from "@/components/ui/GoogleMark";

export function LearnerLoginForm({ error, inApp }: { error?: string; inApp: boolean }) {
  const [blocked, setBlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  // Reaching sign-in means no one is signed in here: drop any saved course pages.
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage({ type: "clear-learner" });
  }, []);
  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Google refuses sign-in inside app webviews, so stop before the trip rather than end on its error. */}
      <form action={signInLearner} onSubmit={(e) => { if (inApp) { e.preventDefault(); setBlocked(true); } }}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-line/50 bg-white px-4 py-3 shadow-card text-sm font-bold text-ink transition-colors hover:bg-surface"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </form>
      {blocked && (
        <div role="alert" className="flex flex-col gap-2 border-2 border-error bg-error-tint p-3 text-sm font-semibold text-error">
          Google sign-in doesn&apos;t work inside this app. Open the ⋯ menu and choose Open in Chrome or Open in Safari.
          <button type="button" onClick={() => void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))} className="self-start underline underline-offset-2">
            {copied ? "Link copied" : "Copy the link"}
          </button>
        </div>
      )}
      {error && <p role="alert" className="border-2 border-error bg-error-tint p-3 text-sm font-semibold text-error">{error}</p>}
      <p className="text-xs text-muted">Use the same Google account you paid or registered with, so we can find your place.</p>
    </div>
  );
}
