import { HIDE_MONEY } from "@/lib/site-status";
import Image from "next/image";
import { faqs, sectionCopy, urgency } from "@/data/program";
import { refund } from "@/data/legal";
import { Accordion } from "@/components/ui/Accordion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { TrackSlug } from "@/types/program";
import Link from "next/link";
import { allFree, tracks } from "@/data/tracks";
import pointing from "@/assets/join-pointing.png";

const NO_UPSELL = "No. There is no advanced program or mastermind to upsell. The track you pick is complete on its own. System Design is a separate course, there only if you want it.";

/** With money hidden: no price, cost or refund questions. */
function noMoneyFaqs(list: typeof faqs) {
  return list
    .filter((f) => !["What is the refund policy?", "What is included in the price?"].includes(f.question))
    .map((f) => (f.question === "Will you try to sell me another course?" ? { ...f, answer: NO_UPSELL } : f));
}

/** While every track is free, the price and refund answers say so instead. */
function freeFaqs(list: typeof faqs) {
  return list
    .filter((f) => f.question !== "What is the refund policy?")
    .map((f) =>
      f.question === "What is included in the price?"
        ? { question: "How much does it cost?", answer: "Nothing, right now: every track is free. You get 30 daily problems, 4 weekly assessments with feedback, role-specific projects, progress tracking, interview preparation, with no card and no payment step." }
        : f.question === "Will you try to sell me another course?"
          ? { ...f, answer: NO_UPSELL }
          : f,
    );
}

/**
 * The closing section: every remaining question on the left, and the thing
 * we want the reader to do on the right.
 */
export function FaqJoin({ defaultTrack }: { defaultTrack?: TrackSlug }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>{sectionCopy.faq.eyebrow}</Eyebrow>
          <h2 id="faq-title" className="display mt-3 text-[clamp(1.85rem,4vw,2.75rem)]">{sectionCopy.faq.title}</h2>
          <p className="mt-3 text-sm text-muted">{sectionCopy.faq.intro}</p>
          <div className="mt-8"><Accordion items={HIDE_MONEY ? noMoneyFaqs(faqs) : allFree ? freeFaqs(faqs) : faqs} variant="card" /></div>
        </div>

        <div id="register" className="scroll-mt-28">
          {/* He points at the form; the bubble sits to his right, as drawn. */}
          <div className="relative z-10 flex items-end gap-0">
            <Image
              src={pointing}
              alt=""
              aria-hidden="true"
              sizes="(min-width: 640px) 16rem, 40vw"
              className="-mb-4 w-36 shrink-0 select-none sm:w-60"
            />
            <div className="relative mb-6 flex-1 rounded-card border-2 border-ink bg-card p-5 sm:p-6">
              <Eyebrow>Join the cohort</Eyebrow>
              <p className="mt-2 text-base font-extrabold leading-snug text-balance sm:text-lg">{urgency.headline}</p>
              <p className="mt-2 text-sm text-muted">{urgency.support}</p>
              {/* The tail, pointing back at him. */}
              <span aria-hidden="true" className="absolute top-8 -left-[11px] size-5 rotate-45 border-b-2 border-l-2 border-ink bg-card" />
            </div>
          </div>

          {/* A short "start here" card instead of the full form: pick a track, then
              the registration page opens with it chosen. Sticks beside the FAQ. */}
          <div className="card p-6 sm:p-8 lg:sticky lg:top-24">
            <h3 className="text-xl font-extrabold">Reserve your seat</h3>
            <p className="mt-1 text-sm text-muted">{HIDE_MONEY ? "Pick your track. It takes a minute, and Day 1 opens straight away." : allFree ? "Every track is free right now. Register and start Day 1 today." : refund.headline}</p>
            <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-2.5">
              {tracks.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/register?track=${t.slug}`}
                    className={`group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-[border-color,background-color,transform] duration-150 hover:border-red-strong hover:bg-red-tint active:scale-[0.99] ${t.slug === defaultTrack ? "border-red-strong bg-red-tint" : "border-line/50"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold">{t.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">Becomes {t.becomes}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-red-strong transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/30 pt-5 text-sm">
              <Link href="/tracks" className="font-semibold underline underline-offset-4 hover:text-red-deep">Not sure? Compare the tracks</Link>
              <Link href="/learn/login" className="text-muted underline underline-offset-4 hover:text-ink">Already registered? Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
