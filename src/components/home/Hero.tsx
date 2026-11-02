import { HIDE_MONEY } from "@/lib/site-status";
import { allFree } from "@/data/tracks";
import Image from "next/image";
import Link from "next/link";
import { hero, navLinks } from "@/data/program";
import { formatINR } from "@/lib/format";
import { SD_OFFER, sdOfferState } from "@/lib/sd-offer";
import { ProductsMenu } from "@/components/layout/ProductsMenu";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Appear } from "@/components/motion/Appear";
import { LightCanvas } from "@/components/effects/LightCanvas";
import cohortPhoto from "@/assets/hero-cohort.png";

/**
 * A loose hand-drawn loop: an ellipse with the faintest wobble, tilted, and
 * swept a little short of a full turn so the ends never quite meet.
 */
function loop(r: number, squash: number, tilt: number, start: number, sweep: number, seed: number, cx = 300, cy = 300) {
  const steps = 160;
  const cos = Math.cos((tilt * Math.PI) / 180);
  const sin = Math.sin((tilt * Math.PI) / 180);
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((start + (sweep * i) / steps) * Math.PI) / 180;
    const rr = r * (1 + 0.007 * Math.sin(3 * a + seed));
    const x = rr * Math.cos(a);
    const y = rr * squash * Math.sin(a);
    points.push(`${(cx + x * cos - y * sin).toFixed(1)} ${(cy + x * sin + y * cos).toFixed(1)}`);
  }
  return `M${points.join("L")}`;
}

// Worked out once, at module load: the strokes never change.
const STROKES = [
  // Every loop starts and ends near the bottom (90° in SVG space), so the
  // break sits behind the group and the arcs over their heads stay whole.
  { d: loop(250, 0.95, -6, 78, 372, 1, 300, 308), width: 3.5 },
  { d: loop(226, 0.9, 12, 104, 360, 2.3, 290, 322), width: 2.25 },
  { d: loop(272, 0.9, -16, 96, 352, 4.1, 312, 300), width: 1.75 },
];

/**
 * Soft pink loops behind the group photo, drawn in once on load. Each stroke
 * fades along its length, which is what makes it read as drawn by hand.
 */
function PaintedRings() {
  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      className="pointer-events-none absolute -top-[13%] left-[47%] w-full -translate-x-1/2"
    >
      <defs>
        <linearGradient id="hero-ring-fade" x1="0" y1="0" x2="600" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e7a3a6" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#efbcbe" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f6d7d8" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#hero-ring-fade)" strokeLinecap="round">
        {STROKES.map((st, i) => (
          <path
            key={i}
            d={st.d}
            pathLength={1}
            strokeWidth={st.width}
            className="paint-draw"
            style={{ animationDelay: `${0.3 + i * 0.2}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

/** One side of the folder tab; `flip` mirrors it for the right-hand side. */
function TabSide({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 72 64"
      aria-hidden="true"
      className={`h-16 w-[4.5rem] shrink-0 text-card ${flip ? "-scale-x-100" : ""}`}
    >
      <path d="M0 64C18 64 24 60 30 46L44 14C49 4 55 0 72 0V64Z" fill="currentColor" />
    </svg>
  );
}

export function Hero() {
  const { open: offerOpen, price } = sdOfferState(null);
  return (
    <section aria-labelledby="hero-title" className="pointer-events-none relative mx-auto max-w-[92rem] px-4 pb-16 sm:px-6 lg:-mt-16 lg:px-8">
      {/* The section is raised into the header (lg:-mt-16), so its empty space
          would swallow clicks meant for the logo and the header button: only
          the tab and the card below take pointer events. */}
      {/* The folder: a tab carrying the site links rises out of the card's top
          edge. One drop-shadow on the wrapper follows the combined outline, so
          tab and card read as a single sheet with no seam between them. */}
      <div className="drop-shadow-[0_18px_36px_rgba(32,30,29,0.13)]">
      <nav aria-label="Primary" className="pointer-events-auto mx-auto hidden h-16 w-fit lg:flex">
        {/* Slanted sides: each is an S-curve, a concave shoulder at the card
            easing into a leaning edge that rounds over into the top. */}
        <TabSide />
        <ul className="-mx-px flex items-center gap-9 bg-card px-4 pt-2 text-[15px] font-semibold">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-red-deep">{l.label}</Link>
            </li>
          ))}
          <li><ProductsMenu /></li>
        </ul>
        <TabSide flip />
      </nav>
      {/* Sized by its content, and never taller than the screen left below
          the banner and header, so the whole folder is always in view. */}
      <div className="pointer-events-auto relative overflow-hidden rounded-slab bg-card lg:max-h-[calc(100dvh-8.75rem)]">
        {/* A red light that leans towards the pointer; desktop only. */}
        <LightCanvas mode="beam" />
        <div className="relative grid gap-10 p-8 pb-0 sm:p-12 sm:pb-0 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4 lg:py-0 lg:pr-0 lg:pl-16">
          <div className="lg:self-center lg:py-8">
            <Appear>
              {/* System Design's way in above the fold; its full section is under the hero. */}
              <Link href="/system-design" className="group mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-[#1a1716] py-1.5 pr-3.5 pl-1.5 text-xs font-bold text-[#fbf6ee] transition-transform duration-150 active:scale-[0.97]">
                <span className="rounded-full bg-[#e7c97a] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2a1d05]">New</span>
                <span className="whitespace-nowrap">
                  System Design{offerOpen && <> · {formatINR(price)}<span className="hidden sm:inline"> until {SD_OFFER.endsLabel}</span></>}
                </span>
                <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </Link>
            </Appear>
            <Appear><Eyebrow>{hero.eyebrow}</Eyebrow></Appear>
            <h1 id="hero-title" className="display mt-5 text-[clamp(2.5rem,4.6vw,4rem)]">
              <Appear delay={0.08} y={24}><span className="block">Become</span></Appear>
              <Appear delay={0.18} y={24}><span className="block text-red-strong">Job-Ready</span></Appear>
              <Appear delay={0.28} y={24}><span className="block">in 30 Days</span></Appear>
            </h1>
            <Appear delay={0.4}><p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted">{hero.subheadline}</p></Appear>
            <Appear delay={0.5} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={hero.primaryCta.href} soft className="rounded-md px-5! py-2.5! text-[13px]!">{hero.primaryCta.label}</ButtonLink>
              <ButtonLink href={hero.secondaryCta.href} variant="secondary" soft className="rounded-md border-line px-5! py-2.5! text-[13px]! hover:bg-ink">
                {hero.secondaryCta.label}
              </ButtonLink>
            </Appear>
            <Appear delay={0.58}>
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
                <svg className="size-4 shrink-0 text-red-strong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" />
                </svg>
                {HIDE_MONEY ? "Every track: 30 days, reviewed work and interview prep." : allFree ? "Free: every track, all 30 days, reviewed work and interview prep." : "Complete all 30 days, get 100% of your fee back."}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                <svg className="size-4 shrink-0 text-red-strong" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
                {hero.timeLine}
              </p>
            </Appear>
          </div>

          <div className="flex items-end justify-center lg:justify-end lg:pt-10">
            <Appear delay={0.25} y={40} className="relative w-full max-w-md lg:max-w-none">
              {/* Inside the photo's own box, so the loops stay centred on the
                  group's heads whatever size the photo renders at. */}
              <PaintedRings />
              <Image
                src={cohortPhoto}
                alt="Four Klymb.ai learners standing together"
                priority
                sizes="(min-width: 1024px) 50vw, 90vw"
                className="relative h-auto w-full lg:max-h-[calc(100dvh-11.25rem)] lg:object-contain lg:object-right-bottom"
              />
            </Appear>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
