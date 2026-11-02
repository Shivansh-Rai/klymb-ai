"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { keepRef, keptRef } from "@/lib/sd-offer";

const KEY = "klymb.sd.ref";

/**
 * Keeps the code from a friend's link in this browser, so someone who comes
 * back later without it still counts for that friend. The code goes back in
 * the URL rather than straight into the form, so the server checks it again.
 * `live` is the code the server accepted on this page, if any.
 */
export function RememberReferral({ live }: { live: string | null }) {
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    try {
      const params = new URLSearchParams(search);
      const kept = keptRef(window.localStorage.getItem(KEY));
      if (live) {
        // The same code again doesn't start its 14 days over.
        if (kept !== live) window.localStorage.setItem(KEY, keepRef(live));
      } else if (params.has("ref")) {
        window.localStorage.removeItem(KEY);
      } else if (kept && !params.has("claim")) {
        // Back from Google, the claim they started already carries its code.
        params.set("ref", kept);
        router.replace(`${path}?${params}`, { scroll: false });
      }
    } catch { /* private mode: only the link itself counts */ }
  }, [live, path, router, search]);

  return null;
}
