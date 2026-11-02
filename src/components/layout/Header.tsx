"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/data/program";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";
import { products } from "@/data/products";
import { ProductsMenu } from "./ProductsMenu";
import { AccountLink } from "./AccountLink";
import { AdminLink } from "./AdminLink";

/**
 * The wordmark and the call to action sit on the page ground; the links
 * float between them on a white bar that reads as part of the hero card
 * below it.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // On the home page the links live in the hero's folder tab instead, so the
  // bar cannot stick: a tab left behind on scroll would float over content.
  const home = pathname === "/";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={home ? "relative bg-paper" : "sticky top-0 z-50 bg-paper"}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <span onClick={() => setOpen(false)}><Wordmark className="text-xl" /></span>

        <nav aria-label="Primary" className={home ? "hidden" : "hidden lg:block"}>
          <ul className="flex items-center gap-9 rounded-full bg-card px-8 py-3 text-[15px] font-semibold shadow-card">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="transition-colors hover:text-red-deep aria-[current=page]:text-red-deep"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li><ProductsMenu /></li>
          </ul>
        </nav>

        <div className="flex items-center gap-3 lg:gap-5">
          {/* Outside the menu on phones too: it is the one thing a returning student comes here for. */}
          <AccountLink className="inline-flex min-h-11 items-center px-1 text-sm font-bold transition-colors hover:text-red-deep" />

          <div className="hidden items-center gap-5 lg:flex">
            <AdminLink className="text-xs font-extrabold uppercase tracking-wider underline-offset-4 hover:text-red-deep hover:underline" />
            {/* Below xl the hero's folder tab leaves room for the account link alone. */}
            <div className="hidden xl:block">
              <ButtonLink href="/tracks" className="rounded-full px-6 py-2.5 text-xs">Choose Your Track</ButtonLink>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg bg-card shadow-card lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="mx-4 mb-2 rounded-card bg-card p-2 shadow-float lg:hidden">
          <ul className="px-3">
            {navLinks.map((l) => (
              <li key={l.href} className="border-b border-line/25 last:border-0">
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 text-lg font-bold">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="px-3 pt-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">Products</p>
            <ul className="mt-1">
              {products.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 border-b border-line/25 py-3 last:border-0">
                  {p.href ? (
                    <a href={p.href} {...(p.external ? { target: "_blank", rel: "noopener" } : {})} onClick={() => setOpen(false)} className="font-bold">{p.name}{p.external ? " ↗" : ""}</a>
                  ) : (
                    <span className="font-bold text-muted">{p.name}</span>
                  )}
                  {p.badge && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">{p.badge}</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <AdminLink onClick={() => setOpen(false)} className="rounded-lg border border-line/50 py-2.5 text-center text-sm font-bold" />
            <ButtonLink href="/tracks" className="w-full rounded-lg" arrow>Choose Your Track</ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}
