"use client";

import { HIDE_MONEY } from "@/lib/site-status";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { enrolment } from "@/data/config";
import { allFree, priceFrom } from "@/data/tracks";
import { formatINR } from "@/lib/format";
import { offerOpen, priceNow } from "@/lib/offer";
import { ButtonLink } from "@/components/ui/Button";

/**
 * On phones, keeps the price, the time it takes and the call to
 * action one tap away once the hero has scrolled past. Hidden again near the
 * registration form so it never covers it.
 */
export function StickyEnrolBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const form = document.getElementById("register");
      const nearForm = form ? form.getBoundingClientRect().top < window.innerHeight : false;
      setShow(window.scrollY > window.innerHeight * 0.8 && !nearForm);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      inert={!show}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line/30 bg-paper/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-extrabold nums">{HIDE_MONEY ? "5 career tracks" : allFree ? "Every track free" : offerOpen() ? `All tracks ${formatINR(priceNow(priceFrom))}` : `From ${formatINR(priceFrom)}`}</p>
          <p className="truncate text-xs text-muted">Start any day · {enrolment.dailyTime} · {HIDE_MONEY ? "Interview prep" : allFree ? "No payment" : "Refunded if you finish"}</p>
        </div>
        <ButtonLink href={HIDE_MONEY ? "#register" : "#pricing"} className="shrink-0" soft>Reserve seat</ButtonLink>
      </div>
    </div>
  );
}
