import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  SD_OFFER, campaignOf, claimProblems, countdownParts, inAppBrowser, linkedInProblem, mobileOf, offPercent, offerPath, sdOfferOpen, sdOfferState, sdPriceFor, sdPriceNow, signInFailedPath,
} from "../src/lib/sd-offer";

const DURING = new Date("2026-11-08T23:59:59+05:30");
const AFTER = new Date("2026-11-09T00:00:00+05:30");

test("₹499 runs to the end of 8 November IST, and the end itself is the full price", () => {
  assert.equal(sdOfferOpen(DURING), true);
  assert.equal(sdPriceNow(DURING), 499);
  assert.equal(sdOfferOpen(AFTER), false);
  assert.equal(sdPriceNow(AFTER), 1999);
});

test("a locked price is kept after the offer, and never raises today's", () => {
  assert.equal(sdPriceFor(499, AFTER), 499);
  assert.equal(sdPriceFor(1999, DURING), 499);
  assert.equal(sdPriceFor(null, AFTER), 1999);
  assert.equal(sdPriceFor(undefined, DURING), 499);
  assert.equal(sdPriceFor(0, AFTER), 1999, "a zero on record is not a free course");
});

test("the page says what the server will charge, in every state", () => {
  assert.deepEqual(
    { ...sdOfferState(null, DURING), endsAt: 0, now: 0 },
    { price: 499, full: 1999, open: true, discounted: true, off: 75, endsAt: 0, now: 0 },
  );
  const locked = sdOfferState(499, AFTER);
  assert.equal(locked.price, 499);
  assert.equal(locked.open, false, "no countdown once the offer is over");
  assert.equal(locked.discounted, true);
  const over = sdOfferState(null, AFTER);
  assert.equal(over.price, 1999);
  assert.equal(over.discounted, false, "no struck-out price when nothing is off");
});

test("the struck-out price and the discount are the ones in the design", () => {
  assert.equal(SD_OFFER.full, 1999);
  assert.equal(offPercent(SD_OFFER.price, SD_OFFER.full), 75);
});

test("mobile numbers are read the way people type them", () => {
  assert.equal(mobileOf("98765 43210"), "9876543210");
  assert.equal(mobileOf("+91 98765-43210"), "9876543210");
  assert.equal(mobileOf("12345"), null);
  assert.equal(mobileOf("5876543210"), null, "Indian mobiles start 6 to 9");
  assert.equal(mobileOf(undefined), null);
});

test("the form says exactly what is missing", () => {
  assert.deepEqual(claimProblems({ name: "Asha", phone: "9876543210", role: "student" }), []);
  assert.deepEqual(claimProblems({ name: " ", phone: "1", role: "" }), ["your name", "a 10-digit mobile number", "student or working professional"]);
  assert.deepEqual(claimProblems({ name: "Asha", phone: "9876543210", role: "founder" }), ["student or working professional"]);
});

test("the LinkedIn link is optional, but has to be one if it's given", () => {
  assert.equal(linkedInProblem(""), null);
  assert.equal(linkedInProblem("   "), null);
  assert.equal(linkedInProblem("https://www.linkedin.com/in/asha-test"), null);
  assert.equal(linkedInProblem("linkedin.com/in/asha-test"), null, "people leave off the https");
  assert.equal(linkedInProblem("in.linkedin.com/in/asha"), null);
  assert.ok(linkedInProblem("asha-test"));
  assert.ok(linkedInProblem("https://example.com/linkedin.com/in/asha"));
  assert.ok(linkedInProblem(`linkedin.com/in/${"x".repeat(200)}`));
});

test("Google brings a claim back to the offer, with its campaign", () => {
  assert.equal(offerPath(null), "/system-design");
  assert.equal(offerPath("sd-launch-1"), "/system-design?utm_campaign=sd-launch-1");
  assert.equal(offerPath(null, true), "/system-design?claim=1");
  assert.equal(offerPath("sd-launch-1", true), "/system-design?claim=1&utm_campaign=sd-launch-1");
});

test("a campaign tag is short and plain, or dropped", () => {
  assert.equal(campaignOf("sd-launch-1"), "sd-launch-1");
  assert.equal(campaignOf("a b"), null);
  assert.equal(campaignOf("x".repeat(61)), null);
  assert.equal(campaignOf(undefined), null);
  assert.equal(campaignOf('"><script>'), null);
});

test("the countdown breaks time into its parts and stops at zero", () => {
  assert.deepEqual(countdownParts(90_061_000), { days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.deepEqual(countdownParts(-5), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test("app webviews are told apart from real browsers", () => {
  assert.equal(inAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0"), true);
  assert.equal(inAppBrowser("Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Version/4.0 Chrome/120.0 Mobile"), true);
  assert.equal(inAppBrowser("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]"), true);
  assert.equal(inAppBrowser("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"), false);
  assert.equal(inAppBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1"), false);
  assert.equal(inAppBrowser("WhatsApp/2.23"), false, "a link preview bot just reads the page");
});

test("a failed Google sign-in goes back where it started, and stays on this site", () => {
  assert.equal(signInFailedPath("http://localhost:3000/system-design?utm_campaign=x"), "/system-design?utm_campaign=x&signin=failed");
  assert.equal(signInFailedPath("/system-design"), "/system-design?signin=failed");
  assert.equal(signInFailedPath("/system-design?claim=1"), "/system-design?claim=1&signin=failed");
  assert.equal(signInFailedPath("https://www.klymb.ai/learn/system-design"), "/learn/login?error=1");
  assert.equal(signInFailedPath("/admin"), null, "admins stay on the admin sign-in");
  assert.equal(signInFailedPath(undefined), null);
  assert.equal(signInFailedPath("https://evil.example/system-design"), "/system-design?signin=failed", "only the path is ever used");
});
