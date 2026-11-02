import clsx from "clsx";
import "./offer.css";

const BULBS = ["#e7c97a", "#f0868b", "#fbf6ee", "#e7c97a"];

/** A string of bulbs along the top of the page, sagging twice across it. */
function Lights({ count, className }: { count: number; className: string }) {
  return (
    <div aria-hidden="true" className={clsx("pointer-events-none absolute inset-x-0 top-0 z-[1] h-[60px]", className)}>
      <svg width="100%" height="60" preserveAspectRatio="none" viewBox="0 0 100 60" className="absolute top-0 left-0">
        <path d="M0 8 Q 25 40 50 14 T 100 10" fill="none" stroke="rgba(231,201,122,.35)" strokeWidth=".25" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: count }, (_, i) => {
        const x = (i + 0.5) / count;
        const top = x < 0.5 ? 8 + (1 - Math.abs(x - 0.25) / 0.25) * 22 : 12 + (1 - Math.abs(x - 0.75) / 0.25) * 8;
        const color = BULBS[i % BULBS.length];
        return (
          <span
            key={i}
            className="sd-offer-light absolute -ml-[3.5px] h-2.5 w-[7px] rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
            style={{ left: `${x * 100}%`, top, background: color, boxShadow: `0 0 10px 3px ${color}`, "--dur": `${1.6 + (i % 5) * 0.35}s`, "--delay": `${((i * 0.17) % 1.5).toFixed(2)}s` } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

/** The offer's night sky: warm glows and a string of Diwali lights. */
export function OfferBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#1a1716] [font-family:var(--font-archivo)] text-[#f6efe4] [container-type:inline-size]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 12% 0%,rgba(201,162,74,.22),transparent 70%),radial-gradient(50% 60% at 100% 30%,rgba(131,5,11,.55),transparent 70%),radial-gradient(40% 40% at 30% 100%,rgba(240,134,139,.12),transparent 70%)" }}
      />
      <Lights count={12} className="lg:hidden" />
      <Lights count={26} className="hidden lg:block" />
      {children}
    </div>
  );
}
