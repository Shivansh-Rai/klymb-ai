/**
 * The System Design offer: ₹499 until the end of 8 November 2026 (IST), then
 * ₹1,999. Pure, so it is unit-tested and usable in the browser. The countdown
 * on the page and the amount on the order both read this, so they can't
 * disagree: when the clock reaches zero the price really changes.
 */
export const SD_COURSE = "system-design";

export const SD_OFFER = {
  price: 499,
  /** What the course costs once the offer ends, so the struck-out price is a real one. */
  full: 1999,
  /** Exclusive end: midnight IST at the start of 9 November. */
  endsAt: "2026-11-09T00:00:00+05:30",
} as const;

export const sdOfferEnd = () => new Date(SD_OFFER.endsAt).getTime();

export function sdOfferOpen(now: Date = new Date()) {
  return now.getTime() < sdOfferEnd();
}

export function sdPriceNow(now: Date = new Date()) {
  return sdOfferOpen(now) ? SD_OFFER.price : SD_OFFER.full;
}

/** What this person pays: a price they locked earlier is kept, and it never raises today's. */
export function sdPriceFor(locked: number | null | undefined, now: Date = new Date()) {
  const today = sdPriceNow(now);
  return locked && locked > 0 ? Math.min(locked, today) : today;
}

export const offPercent = (price: number, full: number) => Math.round((1 - price / full) * 100);

/** Everything the page shows about the price, for one person at one moment. */
export function sdOfferState(locked: number | null | undefined, now: Date = new Date()) {
  const price = sdPriceFor(locked, now);
  return {
    price,
    full: SD_OFFER.full,
    /** The clock is still running for everyone. */
    open: sdOfferOpen(now),
    /** Below the full price, from the offer or a price locked during it. */
    discounted: price < SD_OFFER.full,
    off: offPercent(price, SD_OFFER.full),
    endsAt: sdOfferEnd(),
    now: now.getTime(),
  };
}

export type SdOfferState = ReturnType<typeof sdOfferState>;

/** Days, hours, minutes and seconds left in `ms`, never below zero. */
export function countdownParts(ms: number) {
  const left = Math.max(0, ms);
  return {
    days: Math.floor(left / 864e5),
    hours: Math.floor(left / 36e5) % 24,
    minutes: Math.floor(left / 6e4) % 60,
    seconds: Math.floor(left / 1e3) % 60,
  };
}

export type SdRole = "student" | "working";

/** The 10-digit Indian mobile number in whatever was typed, or null. */
export function mobileOf(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** What is still missing from the form, as the words for "Add …". Empty when it can be sent. */
export function claimProblems({ name, phone, role }: { name: string; phone: string; role: string }) {
  const missing: string[] = [];
  if (name.trim().length < 2) missing.push("your name");
  if (!mobileOf(phone)) missing.push("a 10-digit mobile number");
  if (role !== "student" && role !== "working") missing.push("student or working professional");
  return missing;
}

/** What's wrong with the optional LinkedIn link, if anything. Blank is fine. */
export function linkedInProblem(value: string) {
  const link = value.trim();
  if (!link) return null;
  return link.length <= 200 && /^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/.+/i.test(link) ? null : "Check your LinkedIn URL, or leave it blank.";
}

/** A campaign tag from a link: short and plain, or nothing at all. */
export function campaignOf(value: unknown) {
  return typeof value === "string" && /^[\w.-]{1,60}$/.test(value) ? value : null;
}

/** Back to the offer from Google, `claim` picking up the claim they started, with the campaign they came in on. */
export function offerPath(campaign: string | null, claim = false) {
  const params = new URLSearchParams();
  if (claim) params.set("claim", "1");
  if (campaign) params.set("utm_campaign", campaign);
  const query = params.toString();
  return query ? `/system-design?${query}` : "/system-design";
}

/**
 * Where to return someone whose Google sign-in failed, going by the page that
 * sent them, or null to stay on the admin sign-in. Always a path on this site.
 */
export function signInFailedPath(callback: string | undefined) {
  if (!callback) return null;
  let url: URL;
  try { url = new URL(callback, "https://www.klymb.ai"); } catch { return null; }
  if (url.pathname === "/system-design") {
    url.searchParams.set("signin", "failed");
    return `${url.pathname}${url.search}`;
  }
  return url.pathname.startsWith("/learn") ? "/learn/login?error=1" : null;
}

/**
 * Apps that open links in their own webview. Google refuses to sign anyone in
 * from one (403 disallowed_useragent), so these visitors are asked to open the
 * page in a real browser instead of being sent to an error.
 */
export function inAppBrowser(userAgent: string) {
  return /\b(Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Snapchat|musical_ly|BytedanceWebview|MicroMessenger)\b|\bLine\/|; wv\)/i.test(userAgent);
}
