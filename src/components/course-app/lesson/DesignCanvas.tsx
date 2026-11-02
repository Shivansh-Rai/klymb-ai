"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { CanvasPart, CanvasTask, Lang } from "@/data/system-design/types";
import { emptyBoard, gradeBoard, type Board } from "@/lib/canvas";
import { Icon } from "../icons";

const PARTS: Record<Lang, Record<CanvasPart, string>> = {
  en: { client: "Client", lb: "Load balancer", server: "App server", cache: "Cache", database: "Database", queue: "Queue", worker: "Worker", storage: "Image store", cdn: "CDN", session: "Session store", replica: "Read replica", feed: "Feed store" },
  hi: { client: "Client", lb: "Load balancer", server: "App server", cache: "Cache", database: "Database", queue: "Queue", worker: "Worker", storage: "Image store", cdn: "CDN", session: "Session store", replica: "Read replica", feed: "Feed store" },
};

/** Each part keeps the colour the videos give it: client blue, server purple, database green. */
const TONE: Record<CanvasPart, string> = {
  client: "border-[#3b82f6] bg-[#eff6ff] text-[#1e40af]",
  lb: "border-[#0d9488] bg-[#f0fdfa] text-[#115e59]",
  server: "border-[#8b5cf6] bg-[#f5f3ff] text-[#5b21b6]",
  cache: "border-[#f59e0b] bg-[#fffbeb] text-[#92400e]",
  database: "border-[#16a34a] bg-[#f0fdf4] text-[#166534]",
  queue: "border-[#ea580c] bg-[#fff7ed] text-[#9a3412]",
  worker: "border-[#64748b] bg-[#f8fafc] text-[#334155]",
  storage: "border-[#0891b2] bg-[#ecfeff] text-[#155e75]",
  cdn: "border-[#db2777] bg-[#fdf2f8] text-[#9d174d]",
  session: "border-[#0d9488] bg-[#f0fdfa] text-[#115e59]",
  replica: "border-[#65a30d] bg-[#f7fee7] text-[#3f6212]",
  feed: "border-[#7c3aed] bg-[#faf5ff] text-[#5b21b6]",
};

const UI = {
  en: {
    tray: "Add a part", hint: "Tap a part to add it. Drag boxes to arrange them. Tap one box, then another, to draw an arrow from the first to the second. Tap a box to remove it or its arrows.",
    from: (p: string) => `Arrow from ${p}: now tap where it goes`, empty: "Your board is empty. Add the first part.",
    check: "Check my design", reset: "Start over", remove: "Remove", removeArrow: (a: string, b: string) => `Remove arrow ${a} to ${b}`,
    yours: "Your design", model: "One model design", score: (n: number, of: number) => `${n} of ${of} connections`,
    ok: "Drawn", reversed: "Drawn the wrong way round", missing: "Missing", extra: (p: string) => `Not needed here: ${p}. Fine to keep, but say why you added it.`,
    again: "Edit my design", next: "Continue",
  },
  hi: {
    tray: "Part add karo", hint: "Part tap karo, board pe aa jayega. Boxes ko drag karke jamao. Ek box tap karo, phir doosra: pehle se doosre tak arrow ban jayega. Box ya uske arrows hatane ke liye box tap karo.",
    from: (p: string) => `${p} se arrow: ab tap karo kahan jaana hai`, empty: "Board khaali hai. Pehla part add karo.",
    check: "Mera design check karo", reset: "Phir se shuru", remove: "Hatao", removeArrow: (a: string, b: string) => `${a} se ${b} ka arrow hatao`,
    yours: "Tumhara design", model: "Ek model design", score: (n: number, of: number) => `${of} mein se ${n} connections`,
    ok: "Bana diya", reversed: "Ulti direction mein", missing: "Missing", extra: (p: string) => `Yahan zaroori nahi: ${p}. Rakh sakte ho, par batao kyun.`,
    again: "Design edit karo", next: "Aage badho",
  },
};

const BOX_W = 112;
const BOX_H = 44;

/** Where a line between two box centres leaves each box, so arrows start and end at the edges. */
function trim(ax: number, ay: number, bx: number, by: number, w: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.min(dx ? w / 2 / Math.abs(dx) : Infinity, dy ? BOX_H / 2 / Math.abs(dy) : Infinity, 0.49);
  return { x1: ax + dx * t, y1: ay + dy * t, x2: bx - dx * t, y2: by - dy * t };
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** The board itself: boxes and arrows. Editable when `onChange` is given, else a picture. */
function BoardView({ board, lang, onChange, from, onFrom, label }: {
  board: Board; lang: Lang; label: string;
  onChange?: (b: Board) => void; from?: string | null; onFrom?: (id: string | null) => void;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const names = PARTS[lang];
  // Boxes shrink on a narrow board (a phone, or the side-by-side compare) and always stay inside it.
  const boxW = Math.min(BOX_W, Math.max(64, size.w / 3.6));
  const inside = (v: number, half: number, total: number) => Math.min(Math.max(v, half + 4), total - half - 4);
  const px = (n: { x: number; y: number }) => ({ x: inside(n.x * size.w, boxW / 2, size.w), y: inside(n.y * size.h, BOX_H / 2, size.h) });
  const byId = new Map(board.nodes.map((n) => [n.id, n]));
  const clamp = (v: number, edge: number, total: number) => Math.min(Math.max(v, edge / total), 1 - edge / total);

  const tap = (id: string) => {
    if (!onChange || !onFrom) return;
    if (!from) return onFrom(id);
    if (from === id) return onFrom(null);
    const exists = board.edges.some(([a, b]) => a === from && b === id);
    onChange({ ...board, edges: exists ? board.edges.filter(([a, b]) => !(a === from && b === id)) : [...board.edges, [from, id]] });
    onFrom(null);
  };
  const down = (id: string) => (e: React.PointerEvent) => {
    if (!onChange) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* moves still arrive while over the box */ }
    drag.current = { id, x: e.clientX, y: e.clientY, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !onChange || !ref.current) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    const r = ref.current.getBoundingClientRect();
    const x = clamp((e.clientX - r.left) / r.width, BOX_W / 2, r.width);
    const y = clamp((e.clientY - r.top) / r.height, BOX_H / 2, r.height);
    onChange({ ...board, nodes: board.nodes.map((n) => (n.id === d.id ? { ...n, x, y } : n)) });
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) tap(d.id);
  };

  return (
    <div ref={ref} role="group" aria-label={label} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      className="sd-grid relative h-[340px] w-full touch-none overflow-hidden rounded-xl border-2 border-sd-ink bg-sd-bg [--grid:22px] select-none lg:h-[400px]">
      {size.w > 0 && (
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden="true">
          <defs>
            <marker id={`arrow-${label}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--sd-ink)" />
            </marker>
          </defs>
          {board.edges.map(([a, b]) => {
            const na = byId.get(a);
            const nb = byId.get(b);
            if (!na || !nb) return null;
            const pa = px(na);
            const pb = px(nb);
            const l = trim(pa.x, pa.y, pb.x, pb.y, boxW);
            return <line key={`${a}>${b}`} {...l} stroke="var(--sd-ink)" strokeWidth={2} markerEnd={`url(#arrow-${label})`} />;
          })}
        </svg>
      )}
      {/* An arrow's remove button shows while one of its boxes is selected, so short arrows on a phone stay readable. */}
      {onChange && from && board.edges.map(([a, b]) => {
        const na = byId.get(a);
        const nb = byId.get(b);
        if (!na || !nb || !size.w || (a !== from && b !== from)) return null;
        const mx = (px(na).x + px(nb).x) / 2;
        const my = (px(na).y + px(nb).y) / 2;
        return (
          <button key={`x-${a}>${b}`} type="button" aria-label={UI[lang].removeArrow(names[na.part], names[nb.part])}
            onClick={() => onChange({ ...board, edges: board.edges.filter(([p, q]) => !(p === a && q === b)) })}
            className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-sd-ink bg-sd-bg text-sd-ink hover:bg-sd-accent-100"
            style={{ left: mx, top: my }}>
            <Icon name="x" size={12} stroke={3} />
          </button>
        );
      })}
      {board.nodes.map((n) => {
        const p = px(n);
        return (
          <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y, width: boxW }}>
            <button type="button" onPointerDown={down(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(n.id); } }}
              aria-pressed={from === n.id} disabled={!onChange}
              className={clsx("flex w-full items-center justify-center rounded-lg border-2 px-1.5 text-center text-[12px] leading-tight font-extrabold sm:text-[13px]", TONE[n.part],
                onChange && "cursor-grab active:cursor-grabbing", from === n.id && "ring-4 ring-sd-accent/40")}
              style={{ height: BOX_H }}>
              {names[n.part]}
            </button>
            {onChange && from === n.id && (
              <button type="button" onClick={() => { onChange({ nodes: board.nodes.filter((m) => m.id !== n.id), edges: board.edges.filter(([a, b]) => a !== n.id && b !== n.id) }); onFrom?.(null); }}
                className="absolute -top-2.5 -right-2.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-sd-accent text-sd-bg" aria-label={`${UI[lang].remove} ${names[n.part]}`}>
                <Icon name="x" size={12} stroke={3} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Spots for new boxes, filled in order so a fresh part never lands on top of another. */
const SPOTS = [[0.15, 0.25], [0.5, 0.25], [0.85, 0.25], [0.15, 0.55], [0.5, 0.55], [0.85, 0.55], [0.15, 0.85], [0.5, 0.85], [0.85, 0.85]];

/**
 * "Draw it": design the system from scratch on a blank board, then compare
 * with a model, connection by connection. The board is saved as it goes, so a
 * learner who leaves comes back to their own drawing.
 */
export function DesignCanvas({ task, lang, saved, onSave, onDone }: {
  task: CanvasTask; lang: Lang; saved?: Board;
  onSave: (board: Board) => void; onDone: (score: number, of: number) => void;
}) {
  const ui = UI[lang];
  const names = PARTS[lang];
  const [board, setBoard] = useState<Board>(saved ?? emptyBoard());
  const [from, setFrom] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const change = (b: Board) => { setBoard(b); onSave(b); };

  const add = (part: CanvasPart) => {
    const taken = board.nodes.map((n) => `${n.x.toFixed(2)},${n.y.toFixed(2)}`);
    const spot = SPOTS.find(([x, y]) => !taken.includes(`${x.toFixed(2)},${y.toFixed(2)}`)) ?? [0.5, 0.5];
    const id = `n${board.nodes.reduce((m, x) => Math.max(m, Number(x.id.slice(1)) || 0), 0) + 1}`;
    change({ ...board, nodes: [...board.nodes, { id, part, x: spot[0], y: spot[1] }] });
  };

  const result = gradeBoard(task, board);
  const fromNode = board.nodes.find((n) => n.id === from);

  if (checked) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <h3 className="m-0 text-[26px] leading-[1.05] tracking-[-0.03em] text-balance lg:text-[34px]">{ui.score(result.score, result.of)}</h3>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {result.results.map((r) => (
            <li key={r.key} className="flex flex-col gap-0.5 border-b border-sd-divider pb-2">
              <span className="flex items-center gap-2 text-[15px] font-extrabold">
                <span className={clsx("flex size-5 items-center justify-center rounded-full", r.state === "ok" ? "bg-sd-ink text-sd-bg" : "bg-sd-accent text-sd-bg")}>
                  <Icon name={r.state === "ok" ? "check" : "x"} size={12} stroke={3} />
                </span>
                {names[r.from]} → {names[r.to]}
                <span className="text-[13px] font-semibold text-sd-n-700">· {ui[r.state]}</span>
              </span>
              {r.state !== "ok" && task.why[r.key] && <span className="pl-7 text-[13px] leading-[1.4] text-sd-n-800">{task.why[r.key]}</span>}
            </li>
          ))}
        </ul>
        {result.extra.length > 0 && <p className="m-0 text-[13px] text-sd-n-700">{ui.extra(result.extra.map((p) => names[p]).join(", "))}</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5"><span className="sd-kicker text-sd-n-700">{ui.yours}</span><BoardView board={board} lang={lang} label="yours" /></div>
          <div className="flex flex-col gap-1.5"><span className="sd-kicker text-sd-accent-700">{ui.model}</span><BoardView board={task.model} lang={lang} label="model" /></div>
        </div>
        <p className="m-0 text-[15px] text-pretty">{task.done}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => onDone(result.score, result.of)} className="sd-btn sd-btn-primary h-12 justify-between px-[18px] sm:min-w-[220px]">{ui.next}<Icon name="arrowR" size={18} /></button>
          <button type="button" onClick={() => setChecked(false)} className="sd-btn sd-btn-ghost h-12">{ui.again}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <h3 className="m-0 text-[26px] leading-[1.05] tracking-[-0.03em] text-balance lg:text-[34px]">{task.title}</h3>
      <p className="m-0 text-[15px] text-pretty text-sd-n-800">{task.brief}</p>
      <p className="m-0 text-[13px] text-pretty text-sd-n-700">{ui.hint}</p>
      <div className="flex flex-col gap-1.5">
        <span className="sd-kicker text-sd-n-700">{ui.tray}</span>
        <div className="flex flex-wrap gap-2">
          {task.parts.map((p) => (
            <button key={p} type="button" onClick={() => add(p)} className={clsx("flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 text-[13px] font-extrabold", TONE[p])}>
              <Icon name="plus" size={14} stroke={3} />{names[p]}
            </button>
          ))}
        </div>
      </div>
      <p role="status" aria-live="polite" className="m-0 min-h-5 text-[13px] font-semibold text-sd-accent-700">
        {fromNode ? ui.from(names[fromNode.part]) : board.nodes.length === 0 ? ui.empty : ""}
      </p>
      <BoardView board={board} lang={lang} onChange={change} from={from} onFrom={setFrom} label="board" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={board.edges.length === 0} onClick={() => { setFrom(null); setChecked(true); }}
          className="sd-btn sd-btn-primary h-12 justify-between px-[18px] disabled:opacity-50 sm:min-w-[220px]">{ui.check}<Icon name="arrowR" size={18} /></button>
        <button type="button" disabled={board.nodes.length === 0} onClick={() => { setFrom(null); change(emptyBoard()); }} className="sd-btn sd-btn-ghost h-12 disabled:opacity-50">{ui.reset}</button>
      </div>
    </div>
  );
}
