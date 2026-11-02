"use client";

import clsx from "clsx";
import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { fmt, isLocked, isPaywalled, isSoon, lesson, sec, type CourseState } from "@/lib/course-app";

/** Animation delay for the i-th item of a staggered list. */
export const stagger = (i: number, step: number, base: number): CSSProperties => ({ animationDelay: `${base + i * step}ms` });

/** Pointer parallax: sets --px and --py (-1 to 1) on the element, which its .sd-far/.sd-mid/.sd-near layers read. */
export const parallax = {
  onMouseMove(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  },
  onMouseLeave(e: MouseEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  },
};

/** Counts up from 0 to `to` over a second, easing out. Jumps straight there with reduced motion. */
export function useCountUp(to: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setV(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 1000);
      setV(Math.round((1 - Math.pow(1 - k, 3)) * to));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}

export function Bar({ value, className = "h-1.5", grow, style, fillClass = "bg-sd-accent" }: { value: number; className?: string; grow?: boolean; style?: CSSProperties; fillClass?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-full bg-sd-n-300", className)}>
      <div className={clsx("h-full rounded-full", fillClass, grow ? "sd-a-grow" : "transition-[width] duration-600")} style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...style }} />
    </div>
  );
}

/** Close or Back: an icon on mobile, a labelled outline button on web. */
export function BackButton({ onClick, kind = "back" }: { onClick: () => void; kind?: "back" | "close" }) {
  const label = kind === "back" ? "Back" : "Close";
  const icon: IconName = kind === "back" ? "chevL" : "x";
  return (
    <>
      <button type="button" onClick={onClick} aria-label={label} className="sd-btn sd-btn-icon -ml-2 lg:hidden"><Icon name={icon} /></button>
      <button type="button" onClick={onClick} className="sd-btn sd-btn-secondary hidden h-9 lg:inline-flex"><Icon name={icon} size={16} />{label}</button>
    </>
  );
}

export function ScreenTitle({ children, aside, sub }: { children: ReactNode; aside?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b-2 border-sd-divider pb-3">
      <div>
        <h1 className="m-0 text-[30px] tracking-[-0.03em] lg:text-[42px]">{children}</h1>
        {sub}
      </div>
      {aside}
    </div>
  );
}

export function EmptyState({ icon, title, body, action, titleClass = "text-2xl tracking-[-0.02em]" }: { icon: IconName; title: string; body: string; action: ReactNode; titleClass?: string }) {
  return (
    <div className="sd-a-in flex flex-col gap-3 py-7">
      <span className="flex size-[72px] items-center justify-center rounded-xl border-2 border-dashed border-sd-n-500 text-sd-n-700"><Icon name={icon} size={40} /></span>
      <h3 className={clsx("m-0", titleClass)}>{title}</h3>
      <p className="m-0 max-w-[380px] text-sm text-pretty text-sd-n-800">{body}</p>
      <div>{action}</div>
    </div>
  );
}

export function Stats({ items, className, cellClass = "py-1.5", valueClass = "text-[28px]" }: { items: [ReactNode, string][]; className?: string; cellClass?: string; valueClass?: string }) {
  return (
    <div className={clsx("grid grid-cols-3 border-l border-sd-divider", className)}>
      {items.map(([v, label]) => (
        <div key={label} className={clsx("border-r border-sd-divider px-3", cellClass)}>
          <div className={clsx("leading-[1.55] font-extrabold", valueClass)}>{v}</div>
          <div className="text-xs text-sd-n-700">{label}</div>
        </div>
      ))}
    </div>
  );
}

/** What a lesson row shows: done, current (with time left), or not started; dimmed when offline. */
export function lessonView(s: CourseState, id: string) {
  const l = lesson(id);
  const done = s.done.includes(id);
  const cur = id === s.cur;
  const soon = isSoon(id);
  const locked = !soon && (isPaywalled(id) || isLocked(s, id));
  const p = s.lessons[id];
  return {
    soon,
    locked,
    id,
    title: l.title,
    done,
    cur,
    /** The lesson check's score, and whether that score is a miss waiting for a retake. */
    score: p?.check,
    failed: !!p?.failed,
    dim: soon || locked || s.offline,
    dur: soon ? "Soon" : cur && !done && s.t > 0 ? `${fmt(sec(l.dur) - s.t)} left` : l.dur,
  };
}

export function LessonMark({ done, cur, locked }: { done: boolean; cur: boolean; locked?: boolean }) {
  return (
    <span className={clsx("flex size-[22px] flex-none items-center justify-center rounded-md text-sd-bg", done ? "bg-sd-ink" : cur ? "bg-sd-accent" : locked ? "text-sd-n-500" : "border-[1.5px] border-sd-divider")}>
      {done ? <Icon name="check" size={14} stroke={3} /> : cur ? <Icon name="play" size={12} /> : locked ? <Icon name="lock" size={14} /> : null}
    </span>
  );
}

/** A lesson row's trailing info: length (or time left) and score. `time={false}` leaves the length out; "Soon" still shows. */
export function Duration({ v, time = true }: { v: ReturnType<typeof lessonView>; time?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-xs text-sd-n-700">
      {(time || v.soon) && v.dur}
      {v.score !== undefined && (
        <span className={clsx("rounded-md px-1.5 py-px font-bold", v.failed ? "bg-sd-accent-100 text-sd-accent-700" : "bg-sd-n-300 text-sd-ink")} title={v.failed ? "Not passed yet" : "Lesson assessment score"}>{v.score}%</span>
      )}
    </span>
  );
}

export function Toggle({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: string; sub?: string | null }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 text-left">
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold">{label}</span>
        {sub && <span className="text-xs text-sd-n-700">{sub}</span>}
      </span>
      <span className={clsx("h-6 w-11 flex-none rounded-full p-[3px] transition-colors duration-200", on ? "bg-sd-accent" : "bg-sd-n-400")}>
        <span className={clsx("block size-[18px] rounded-full bg-sd-bg transition-transform duration-200", on && "translate-x-5")} />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, className, itemClass = "px-2.5 py-2 text-left text-[13px]" }: { value: T; options: [T, string][]; onChange: (v: T) => void; className?: string; itemClass?: string }) {
  return (
    <div role="radiogroup" className={clsx("grid overflow-hidden rounded-lg border border-sd-divider", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={clsx("cursor-pointer truncate font-semibold transition-colors duration-200", itemClass, value === v ? "bg-sd-ink text-sd-bg" : "bg-transparent")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
