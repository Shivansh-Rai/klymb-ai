import { HIDE_MONEY } from "@/lib/site-status";
import Link from "next/link";
import { APP_URL } from "@/data/products";
import { contact, socials } from "@/data/config";
import { brand, footerLinks } from "@/data/program";
import { entity } from "@/data/legal";
import { tracks } from "@/data/tracks";

function Column({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm text-white/60">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-night text-paper">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Klymb.ai home" className="display inline-flex min-h-6 items-baseline py-1 text-xl text-white">
              KLYMB<span className="text-red-soft">.AI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{brand.tagline}</p>
            <a href={`mailto:${contact.email}`} className="mt-5 inline-block py-1 text-sm font-semibold text-white underline underline-offset-4">
              {contact.email}
            </a>
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold transition-colors hover:border-white/60"
                  >
                    {s.label}
                    <span className="text-white/50">{s.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Column title="Programs" links={[...tracks.map((t) => ({ label: t.name, href: `/tracks/${t.slug}` })), { label: "System Design", href: "/system-design" }, { label: HIDE_MONEY ? "app.klymb.ai ↗" : "app.klymb.ai: free platform ↗", href: APP_URL }]} />
          <Column title="Resources" links={footerLinks.program} />
          <Column title="Legal" links={footerLinks.company} />
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/12 pt-7 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {entity.registeredName} ({brand.name}). All rights reserved.
            Klymb.ai does not guarantee employment, placement or salary outcomes.
          </p>
          <p className="shrink-0">Built for modern capability standards.</p>
        </div>
      </div>
    </footer>
  );
}
