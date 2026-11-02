"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import type { BuildTask, Lang } from "@/data/system-design/types";
import { pad } from "@/lib/course-app";
import { Icon } from "../icons";

const UI = {
  en: { tray: "Pieces", left: (n: number) => `${n} left`, wrong: "Not there.", built: "Built!", clean: "First try.", tries: (n: number) => `${n} wrong ${n === 1 ? "drop" : "drops"}.`, next: "Continue", picked: "Now tap its slot", hint: "Drag a box to its slot, or tap box then slot" },
  hi: { tray: "Pieces", left: (n: number) => `${n} baaki`, wrong: "Yahan nahi.", built: "Ban gaya!", clean: "Pehli baar mein.", tries: (n: number) => `${n} galat drop.`, next: "Aage badho", picked: "Ab woh slot tap karo", hint: "Box ko slot pe drag karo, ya box tap karo phir slot" },
};

/**
 * Drag a box from the tray onto the slot whose job it does, or tap a box and
 * then a slot (easier with a thumb). Right drops lock in; wrong ones bounce
 * back with what that box actually does, which is the lesson.
 */
export function DiagramBuilder({ task, lang, onDone }: { task: BuildTask; lang: Lang; onDone: (wrong: number) => void }) {
  const ui = UI[lang];
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [miss, setMiss] = useState<{ slot: string; chip: string } | null>(null);
  const [wrong, setWrong] = useState(0);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const start = useRef<{ id: string; x: number; y: number; moved: boolean; lastX: number; lastY: number } | null>(null);
  const board = useRef<HTMLDivElement>(null);

  const slotIds = task.rows.flat();
  const done = slotIds.every((s) => placed[s]);
  const used = new Set(Object.values(placed));
  const tray = task.chips.filter((c) => !used.has(c.id));
  const label = (id: string) => task.chips.find((c) => c.id === id)?.label ?? id;

  function drop(chip: string, slot: string) {
    setPicked(null);
    if (placed[slot]) return;
    if (task.slots[slot].answer === chip) {
      setPlaced((p) => ({ ...p, [slot]: chip }));
      setMiss(null);
    } else {
      setWrong((w) => w + 1);
      setMiss({ slot, chip });
    }
  }

  /**
   * The empty slot a drop at (x, y) lands in: the one under the pointer, or the
   * nearest one within a thumb's width, so a box released on a slot's edge still counts.
   */
  function slotAt(x: number, y: number) {
    let best: { id: string; d: number } | null = null;
    for (const el of board.current?.querySelectorAll<HTMLElement>("[data-slot]") ?? []) {
      const id = el.dataset.slot!;
      if (placed[id]) continue;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (d <= 44 && (!best || d < best.d)) best = { id, d };
    }
    return best?.id ?? null;
  }

  const onDown = (id: string) => (e: React.PointerEvent) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* no capture: moves still reach the box while the pointer is over it, and release still drops */ }
    start.current = { id, x: e.clientX, y: e.clientY, moved: false, lastX: e.clientX, lastY: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) return;
    if (!s.moved) setMiss(null);
    s.moved = true;
    setDrag({ id: s.id, x: e.clientX, y: e.clientY });
    setOver(slotAt(e.clientX, e.clientY));
  };
  /** Release, or the browser taking the pointer away: either way the box lands where it was let go. */
  const finish = (x?: number, y?: number) => {
    const s = start.current;
    start.current = null;
    setDrag(null);
    setOver(null);
    if (!s) return;
    if (!s.moved) { setPicked((p) => (p === s.id ? null : s.id)); return; }
    const slot = slotAt(x ?? s.lastX, y ?? s.lastY);
    if (slot) drop(s.id, slot);
  };

  const missChip = miss && task.chips.find((c) => c.id === miss.chip);
  // While a box is held (picked or dragged), every open slot lights up as a place it can go.
  const holding = !!picked || !!drag;
  const fresh = Object.keys(placed).length === 0 && wrong === 0 && !holding;

  return (
    <div className="flex flex-1 flex-col">
      <h3 className="m-0 text-[26px] leading-[1.05] tracking-[-0.03em] text-balance lg:text-[34px]">{task.title}</h3>
      <p className="m-0 mt-2 text-[15px] text-pretty text-sd-n-800">{task.intro}</p>

      <div ref={board} className="mt-4 grid grid-cols-1 gap-4 border-t-2 border-sd-ink pt-3.5 lg:grid-cols-3">
        {task.rows.map((row, r) => (
          <div key={r} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-sd-accent">{pad(r + 1)}</span>
              {task.rowLabels?.[r] && <span className="text-[15px] font-extrabold tracking-[-0.01em]">{task.rowLabels[r]}</span>}
            </div>
            <div className="relative flex flex-col gap-1.5 pl-4">
              <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-1 w-0.5 bg-sd-n-300" />
              {row.map((sid) => {
                const got = placed[sid];
                const bad = miss?.slot === sid;
                const [when, ...rest] = task.slots[sid].role.split(": ");
                const what = rest.join(": ") || task.slots[sid].role;
                return (
                  <button
                    key={sid}
                    type="button"
                    data-slot={sid}
                    onClick={() => picked && drop(picked, sid)}
                    aria-label={got ? `${label(got)}: ${task.slots[sid].role}` : task.slots[sid].role}
                    className={clsx(
                      "relative flex min-h-12 cursor-pointer flex-col justify-center gap-px rounded-lg border-[1.5px] px-3 py-1.5 text-left transition-colors duration-200",
                      got && "border-sd-ink bg-sd-ink",
                      !got && !bad && !holding && "border-dashed border-sd-n-400 bg-transparent",
                      !got && !bad && holding && over !== sid && "border-solid border-sd-accent bg-sd-accent-100 hover:bg-sd-accent-100",
                      bad && !drag && "animate-[shake_.35s] border-solid border-sd-accent bg-sd-accent-100",
                      !got && over === sid && "border-solid border-sd-accent bg-sd-accent-100",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={clsx("absolute top-1/2 -left-4 -mt-[5px] size-2.5 rounded-full border-2", got ? "border-sd-ink bg-sd-ink" : "border-sd-n-400 bg-sd-bg")}
                    />
                    <span className={clsx("text-[10px] font-extrabold tracking-[0.08em] uppercase", got ? "text-sd-accent-400" : "text-sd-accent-700")}>{when}</span>
                    {got ? (
                      <span className="flex items-center gap-1 text-sm leading-[1.25] font-extrabold text-sd-bg"><Icon name="check" size={14} stroke={3} />{label(got)}</span>
                    ) : (
                      <span className="text-[13px] leading-[1.3] text-sd-n-700">{what}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p role="status" aria-live="polite" className="m-0 mt-2.5 mb-1.5 min-h-[1.6em] text-sm">
        {missChip ? (
          <span className="text-sd-accent-700"><b>{ui.wrong}</b> {missChip.label} = {missChip.does}.</span>
        ) : picked ? (
          <span className="font-semibold text-sd-n-700">{ui.picked}</span>
        ) : fresh ? (
          <span className="flex items-center gap-2 font-semibold text-sd-accent-700">
            <span className="flex flex-none animate-bounce text-sd-accent"><Icon name="arrowR" size={18} className="block flex-none -rotate-90" /></span>
            {ui.hint}
          </span>
        ) : null}
      </p>

      {done && (
        <div className="sd-a-in mt-2 flex flex-col gap-1.5 border-t-2 border-sd-ink pt-4">
          <span className="text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em]">{ui.built} {wrong === 0 ? ui.clean : ui.tries(wrong)}</span>
          <span className="text-[15px] text-sd-n-800">{task.done}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-[4] -mx-5 mt-auto border-t border-sd-divider bg-sd-bg px-5 pt-2.5 pb-4 shadow-[0_-10px_20px_-14px_rgba(32,30,29,.25)] lg:mx-0 lg:px-10 lg:pt-3.5 lg:pb-[18px]">
        {!done && (
          <div className="mb-2.5 border-b border-sd-divider pt-0.5 pb-2.5">
            <h6 className="m-0 flex justify-between border-t border-sd-divider pt-3 text-[11px] font-extrabold tracking-[0.12em] uppercase">
              <span>{ui.tray}</span>
              <span className="text-sd-n-600">{ui.left(slotIds.length - Object.keys(placed).length)}</span>
            </h6>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tray.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onPointerDown={onDown(c.id)}
                  onPointerMove={onMove}
                  onPointerUp={(e) => finish(e.clientX, e.clientY)}
                  onLostPointerCapture={() => finish()}
                  onPointerCancel={() => finish()}
                  className={clsx(
                    "flex min-h-11 cursor-grab touch-none items-center gap-1.5 rounded-lg border-[1.5px] border-sd-ink px-3 py-2 text-sm font-bold transition-colors select-none hover:bg-sd-accent-100 active:cursor-grabbing",
                    picked === c.id ? "bg-sd-ink text-sd-bg" : "bg-sd-bg",
                    drag?.id === c.id && "opacity-40",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="flex-1" />
          <button type="button" onClick={() => onDone(wrong)} disabled={!done} className="sd-btn sd-btn-primary h-[52px] flex-1 max-w-[280px] justify-between rounded-[10px] px-[18px] text-base">
            {ui.next}<Icon name="arrowR" size={18} />
          </button>
        </div>
      </div>

      {drag && (
        <div aria-hidden="true" className="sd-shadow-lg pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-sd-ink bg-sd-ink px-3.5 py-2.5 text-sm font-extrabold text-sd-bg" style={{ left: drag.x, top: drag.y }}>
          {label(drag.id)}
        </div>
      )}
    </div>
  );
}
