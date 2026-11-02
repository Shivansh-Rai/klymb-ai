"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

/**
 * Where a stamp can sit: from the left or right edge, and down from the top, in
 * percent. Never the bottom third, where the captions and the controls are.
 */
const SPOTS: { side: "l" | "r"; x: number; y: number }[] = [
  { side: "l", x: 3, y: 8 },
  { side: "r", x: 3, y: 8 },
  { side: "l", x: 3, y: 40 },
  { side: "r", x: 3, y: 40 },
  { side: "l", x: 30, y: 24 },
];
const MOVE_MS = 14_000;

/**
 * The viewer's email, faint, over the lesson video: two stamps that drift
 * between spots every few seconds, so a cropped or screen-recorded copy still
 * shows whose seat it came from. It sits inside the player box, so it comes
 * along in full screen. It can't stop a camera; it's there to be traced.
 */
export function VideoWatermark({ text }: { text: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => n + 1), MOVE_MS);
    return () => window.clearInterval(t);
  }, []);
  return (
    <>
      {[SPOTS[i % SPOTS.length], SPOTS[(i + 2) % SPOTS.length]].map((p, k) => (
        <span
          key={k}
          aria-hidden="true"
          data-watermark
          className={clsx(
            "pointer-events-none absolute z-[2] whitespace-nowrap text-[clamp(10px,1.7cqw,18px)] font-semibold tracking-wide text-white/40 select-none [text-shadow:0_1px_2px_rgba(0,0,0,.65)] transition-[left,right,top] duration-[1500ms] motion-reduce:transition-none",
          )}
          style={{ top: `${p.y}%`, ...(p.side === "l" ? { left: `${p.x}%` } : { right: `${p.x}%` }) }}
        >
          {text}
        </span>
      ))}
    </>
  );
}
