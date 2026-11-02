"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, writeConsent } from "@/lib/consent";

/**
 * Tells first-time visitors about analytics and lets them say no in one tap.
 * The model stays opt-out, as the Cookie Policy states: analytics is on unless
 * someone turns it off. Once a choice is saved the banner does not return
 * until the policy version changes.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(readConsent() === null);
    sync();
    window.addEventListener("klymb:consent", sync);
    return () => window.removeEventListener("klymb:consent", sync);
  }, []);

  if (!open) return null;
  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-card bg-night p-4 text-sm text-paper shadow-float sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm"
    >
      {/* On a phone the help button sits over this corner: the text stays clear of it. */}
      <p className="pr-14 leading-relaxed text-white/85 sm:pr-0">
        We use Google Analytics to see which pages help people. No ads, no selling data.{" "}
        <Link href="/cookies" className="font-semibold text-white underline underline-offset-2">Cookie Policy</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => writeConsent("all")} className="rounded-lg bg-white px-4 py-2 font-bold text-ink hover:bg-paper">
          OK
        </button>
        <button type="button" onClick={() => writeConsent("necessary")} className="rounded-lg border border-white/30 px-4 py-2 font-bold hover:bg-white/10">
          Turn analytics off
        </button>
      </div>
    </div>
  );
}
