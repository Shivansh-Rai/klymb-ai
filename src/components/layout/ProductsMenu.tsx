"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { products, type Product } from "@/data/products";

const BADGE: Record<NonNullable<Product["badge"]>, string> = {
  Free: "bg-[#dcfce7] text-[#166534]",
  "Coming soon": "bg-surface text-muted",
  "You're here": "bg-red-tint text-red-deep",
  New: "bg-[#e7c97a] text-[#2a1d05]",
};

/**
 * "Products ▾": the Klymb family in a small panel. Opens on hover (with a short
 * close delay so the pointer can travel into it), on click or tap, and from the
 * keyboard; Escape or a tap outside closes it. Scales in from its trigger.
 */
export function ProductsMenu({ align = "center" }: { align?: "center" | "right" }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const hideSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 140); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={wrap} className="relative" onPointerEnter={(e) => e.pointerType === "mouse" && show()} onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 transition-colors hover:text-red-deep aria-expanded:text-red-deep"
      >
        Products
        <svg viewBox="0 0 24 24" className={clsx("size-3.5 transition-transform duration-200", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      <div
        className={clsx(
          "absolute top-full z-50 pt-3",
          align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
          !open && "pointer-events-none",
        )}
      >
        <ul
          className={clsx(
            "w-80 rounded-card bg-card p-2 text-left shadow-[0_18px_44px_rgba(32,30,29,0.18)] ring-1 ring-line/40",
            align === "center" ? "origin-top" : "origin-top-right",
            "transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            open ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
          {products.map((p) => (
            <li key={p.name}><ProductRow product={p} onPick={() => setOpen(false)} /></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProductRow({ product: p, onPick }: { product: Product; onPick: () => void }) {
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className="text-sm font-extrabold text-ink">{p.name}</span>
        {p.badge && <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider", BADGE[p.badge])}>{p.badge}</span>}
        {p.external && <span aria-hidden="true" className="ml-auto text-muted">↗</span>}
      </span>
      <span className="mt-0.5 block text-xs font-medium leading-relaxed text-muted">{p.description}</span>
    </>
  );
  const row = "block rounded-xl px-3 py-2.5";
  if (!p.href) return <div aria-disabled="true" className={clsx(row, "opacity-70")}>{body}</div>;
  return p.external ? (
    <a href={p.href} target="_blank" rel="noopener" onClick={onPick} className={clsx(row, "transition-colors hover:bg-surface")}>{body}</a>
  ) : (
    <Link href={p.href} onClick={onPick} className={clsx(row, "transition-colors hover:bg-surface")}>{body}</Link>
  );
}
