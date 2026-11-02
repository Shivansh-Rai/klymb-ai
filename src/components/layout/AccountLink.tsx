"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "Log in", or the way back in once the server says this visitor is signed in.
 * Asks after load, so public pages stay static for everyone else.
 */
export function AccountLink({ className }: { className?: string }) {
  const [link, setLink] = useState<{ label: string; href: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/account", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { link?: { label: string; href: string } | null } | null) => live && setLink(d?.link ?? null))
      .catch(() => {});
    return () => { live = false; };
  }, []);

  return <Link href={link?.href ?? "/learn/login"} prefetch={false} className={className}>{link?.label ?? "Log in"}</Link>;
}
