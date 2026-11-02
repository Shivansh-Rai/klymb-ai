import Image from "next/image";
import Link from "next/link";
import { Appear } from "@/components/motion/Appear";
import { Lights } from "@/components/system-design-offer/OfferBackdrop";
import { BUILT_LESSONS } from "@/data/system-design/course-app";
import { LESSON_COUNT } from "@/lib/course-app";
import { formatINR } from "@/lib/format";
import { SD_OFFER, SD_STATS, sdOfferState } from "@/lib/sd-offer";

const OFFER_PAGE = "/system-design";

/**
 * System Design, featured under the hero in the offer page's own night-sky
 * look, so the page it leads to feels like the same place. The price reads the
 * same clock as the order, and the sale wording goes when the offer ends.
 */
export function SystemDesignFeature() {
  const offer = sdOfferState(null);
  return (
    <section aria-labelledby="sd-feature-title" className="mx-auto max-w-[92rem] px-4 pb-16 sm:px-6 lg:px-8">
      <Appear>
        <div className="relative overflow-hidden rounded-slab bg-[#1a1716] text-[#f6efe4] shadow-float">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 70% at 8% 0%,rgba(201,162,74,.2),transparent 70%),radial-gradient(55% 80% at 100% 40%,rgba(131,5,11,.55),transparent 70%)" }}
          />
          {offer.open && (
            <>
              <Lights count={10} className="lg:hidden" />
              <Lights count={26} className="hidden lg:block" />
            </>
          )}

          <div className="relative grid grid-cols-[minmax(0,1fr)] gap-8 px-6 pt-14 pb-7 sm:px-12 sm:pt-16 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:px-16 lg:pt-20 lg:pb-16">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#e7c97a]">
                <span className="size-[7px] rounded-full bg-[#e7c97a] shadow-[0_0_10px_2px_rgba(231,201,122,.8)]" />
                {offer.open ? "New course · Early Diwali offer" : "New course"}
              </p>
              <h2 id="sd-feature-title" className="display mt-4 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[.98] text-[#fbf6ee]">
                System design, <span className="text-[#f0868b]">phone pe.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#d9cfc2]">System design, explained with real examples. Built for interviews.</p>

              <dl className="mt-6 grid max-w-md grid-cols-3 gap-4 border-t border-[rgba(246,239,228,.18)] pt-4">
                {SD_STATS.map(([value, label]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dd className="display order-1 text-2xl text-[#fbf6ee] sm:text-[1.75rem]">{value}</dd>
                    <dt className="order-2 text-xs text-[#b9ad9f]">{label}</dt>
                  </div>
                ))}
              </dl>

              <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="display text-4xl text-[#fbf6ee] sm:text-[2.75rem]">{formatINR(offer.price)}</span>
                {offer.discounted && <span className="text-lg font-bold text-[rgba(251,246,238,.7)] line-through decoration-[#f0868b] decoration-2">{formatINR(offer.full)}</span>}
                {offer.open && <span className="text-sm font-bold text-[#f3d48a]">until {SD_OFFER.endsLabel}</span>}
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={OFFER_PAGE} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#fbf6ee] px-5 py-3 text-sm font-extrabold text-[#83050b] transition-[background-color,transform] duration-150 hover:bg-white active:scale-[0.97]">
                  {offer.open ? `Claim my ${formatINR(offer.price)} seat` : "See the course"}
                  <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                </Link>
                <p className="text-xs leading-snug text-[#b9ad9f] sm:max-w-[15rem]">Early access: {BUILT_LESSONS.length} of {LESSON_COUNT} lessons are live, the rest added as they&apos;re ready.</p>
              </div>
            </div>

            <figure className="m-0 flex flex-col gap-2">
              <Link href={`${OFFER_PAGE}#course-intro`} aria-label="Watch the System Design course intro" className="group relative block overflow-hidden rounded-xl border border-[rgba(246,239,228,.18)]">
                <Image src="/videos/system-design/overview-21day-poster.jpg" alt="" width={1280} height={720} sizes="(min-width: 1024px) 45vw, 90vw" className="block aspect-video h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]" />
                <span aria-hidden="true" className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fbf6ee] text-[#83050b] shadow-[0_8px_24px_rgba(0,0,0,.35)] transition-transform duration-150 group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
                </span>
              </Link>
              <figcaption className="text-xs text-[#b9ad9f]">Course intro · 2:26 · Hinglish</figcaption>
            </figure>
          </div>
        </div>
      </Appear>
    </section>
  );
}
