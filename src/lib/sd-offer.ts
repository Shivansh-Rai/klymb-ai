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
  /** The last day of the offer, in words. */
  endsLabel: "8 Nov",
} as const;

/** The course at a glance, on the offer page and the home page. */
export const SD_STATS = [["21", "days"], ["15 min", "a day"], ["5", "days of AI design"]] as const;

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

/**
 * The referral offer: three friends buy within 10 days of your purchase and
 * your whole fee comes back, with the course still yours. Buyers from before
 * `startsAt` get their 10 days from then, so nobody starts with a closed window.
 */
export const SD_REFERRAL = { friends: 3, days: 10, startsAt: "2026-11-03T00:00:00+05:30" } as const;

/** No I, O, 0 or 1: a code gets read aloud and retyped from a phone. */
export const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_LENGTH = 8;

/** A referral code from a link or the form, in its stored form, or null when it can't be one. */
export function refOf(value: unknown) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return code.length === REFERRAL_CODE_LENGTH && [...code].every((c) => REFERRAL_ALPHABET.includes(c)) ? code : null;
}

/** What's wrong with the optional code field, if anything. Blank is fine. */
export function referralCodeProblem(value: string) {
  return !value.trim() || refOf(value) ? null : "Check the referral code, or leave it blank.";
}

/** Why this buyer can't use this referrer's code, if anything. The server asks, before any money moves. */
export function referralProblem(referrer: { email: string; phone: string | null } | null, buyer: { email: string; phone: string }) {
  if (!referrer) return "That referral code isn't valid. Check it, or leave it blank.";
  if (referrer.email === buyer.email || (referrer.phone && mobileOf(referrer.phone) === mobileOf(buyer.phone))) return "You can't use your own referral code.";
  return null;
}

/** When someone's window to refer friends closes, in ms. */
export function referralDeadline(purchasedAt: string | Date) {
  const from = Math.max(new Date(purchasedAt).getTime(), new Date(SD_REFERRAL.startsAt).getTime());
  return from + SD_REFERRAL.days * 864e5;
}

/** Time left, in the words the card uses: days until the last day, then hours. */
export function referralLeft(ms: number) {
  if (ms <= 0) return "time's up";
  if (ms >= 864e5) { const days = Math.ceil(ms / 864e5); return `${days} ${days === 1 ? "day" : "days"} left`; }
  const hours = Math.ceil(ms / 36e5);
  return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
}

export type ReferralState = "open" | "earned" | "refunded" | "closed";

/** Where someone stands. Three friends beat the clock, and a paid refund beats everything. */
export function referralState({ count, deadline, refunded }: { count: number; deadline: number; refunded: boolean }, now = Date.now()): ReferralState {
  if (refunded) return "refunded";
  if (count >= SD_REFERRAL.friends) return "earned";
  return now < deadline ? "open" : "closed";
}

/** A buyer's referral offer, as the course and the receipt show it. */
export interface ReferralView {
  code: string;
  link: string;
  count: number;
  state: ReferralState;
  /** "7 days left". */
  left: string;
  /** "12 Nov, 9:30 pm". */
  ends: string;
  /** What comes back: "₹499". */
  amount: string;
  /** Made-up data for `?start=refer`, so its link can't be sent to anyone. */
  sample?: boolean;
}

/** Why someone has no offer to show. `retry` is a failed read, so a buyer is never told they have none because of an outage. */
export type ReferralMiss = "signin" | "buy" | "granted" | "retry";

/** What the Refer tab shows: their offer, or why there isn't one. */
export type ReferralStanding = { view: ReferralView; why: null } | { view: null; why: ReferralMiss };

export const referralLink = (site: string, code: string) => `${site}/system-design?ref=${code}`;

/** A lesson post with their link on the end, in the lesson's language. */
export function referralPost(post: string, link: string, lang: "en" | "hi") {
  return `${post}\n\n${lang === "hi" ? "Mere saath seekhna hai? Yahan join karo" : "Want to learn this with me? Join here"}: ${link}`;
}

/** How long this browser keeps a code it was sent, so a friend who comes back later without the link still counts. */
export const REFERRAL_KEPT_DAYS = 14;

/** A code as this browser stores it. */
export const keepRef = (code: string, now = Date.now()) => JSON.stringify({ code, until: now + REFERRAL_KEPT_DAYS * 864e5 });

/** The code this browser is keeping, or null when there's none, it ran out, or it isn't one of ours. */
export function keptRef(stored: string | null, now = Date.now()) {
  try {
    const { code, until } = JSON.parse(stored ?? "null") as { code: unknown; until: unknown };
    return typeof until === "number" && now < until ? refOf(code) : null;
  } catch {
    return null;
  }
}

/** Back to the offer from Google, `claim` picking up the claim they started, with the campaign and referral they came in on. */
export function offerPath(campaign: string | null, claim = false, ref: string | null = null) {
  const params = new URLSearchParams();
  if (claim) params.set("claim", "1");
  if (campaign) params.set("utm_campaign", campaign);
  if (ref) params.set("ref", ref);
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
