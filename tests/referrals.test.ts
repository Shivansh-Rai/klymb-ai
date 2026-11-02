import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { defaultState, fromStored, toStored } from "../src/lib/course-app";
import {
  REFERRAL_ALPHABET, REFERRAL_CODE_LENGTH, SD_REFERRAL, refOf, referralCodeProblem, referralDeadline, referralLeft, referralLink, referralProblem, referralState,
} from "../src/lib/sd-offer";

const DAY = 864e5;
const LAUNCH = new Date(SD_REFERRAL.startsAt).getTime();

test("the offer is 3 friends in 10 days", () => {
  assert.equal(SD_REFERRAL.friends, 3);
  assert.equal(SD_REFERRAL.days, 10);
});

test("a code is tidied up, and anything else is refused", () => {
  assert.equal(refOf("ABCD2345"), "ABCD2345");
  assert.equal(refOf(" abcd2345 "), "ABCD2345", "retyped from a phone");
  for (const bad of ["", "ABC", "ABCD23456", "ABCD234O", "ABCD2341", "ABCD 345", "<script>", null, undefined, 12345678]) {
    assert.equal(refOf(bad), null, String(bad));
  }
});

test("every code we can make is one we accept", () => {
  assert.equal(refOf(REFERRAL_ALPHABET.slice(0, REFERRAL_CODE_LENGTH)), REFERRAL_ALPHABET.slice(0, REFERRAL_CODE_LENGTH));
  assert.equal(refOf(REFERRAL_ALPHABET.slice(-REFERRAL_CODE_LENGTH)), REFERRAL_ALPHABET.slice(-REFERRAL_CODE_LENGTH));
});

test("the code field may be blank, but not wrong", () => {
  assert.equal(referralCodeProblem(""), null);
  assert.equal(referralCodeProblem("  "), null);
  assert.equal(referralCodeProblem("abcd2345"), null);
  assert.match(referralCodeProblem("nope") ?? "", /Check the referral code/);
});

test("a bad code, your own code and your own phone are all refused before paying", () => {
  const buyer = { email: "new@gmail.com", phone: "+919876543210" };
  assert.match(referralProblem(null, buyer) ?? "", /isn't valid/);
  assert.match(referralProblem({ email: "new@gmail.com", phone: "+919000000000" }, buyer) ?? "", /your own/);
  assert.match(referralProblem({ email: "other@gmail.com", phone: "98765 43210" }, buyer) ?? "", /your own/, "same phone, second account");
  assert.equal(referralProblem({ email: "other@gmail.com", phone: "+919000000000" }, buyer), null);
  assert.equal(referralProblem({ email: "other@gmail.com", phone: null }, buyer), null);
});

test("the window runs 10 days from purchase, to the minute", () => {
  const bought = new Date(LAUNCH + 2 * DAY + 9 * 36e5);
  assert.equal(referralDeadline(bought), bought.getTime() + 10 * DAY);
  assert.equal(referralDeadline(bought.toISOString()), bought.getTime() + 10 * DAY, "as the database returns it");
});

test("a buyer from before launch gets 10 days from launch", () => {
  assert.equal(referralDeadline(new Date(LAUNCH - 3 * DAY)), LAUNCH + 10 * DAY);
});

test("where someone stands", () => {
  const deadline = LAUNCH + 10 * DAY;
  const before = deadline - 1;
  assert.equal(referralState({ count: 0, deadline, refunded: false }, before), "open");
  assert.equal(referralState({ count: 2, deadline, refunded: false }, before), "open");
  assert.equal(referralState({ count: 3, deadline, refunded: false }, before), "earned");
  assert.equal(referralState({ count: 2, deadline, refunded: false }, deadline), "closed", "the deadline itself is too late");
  assert.equal(referralState({ count: 3, deadline, refunded: false }, deadline + DAY), "earned", "friends who bought in time still count after it");
  assert.equal(referralState({ count: 3, deadline, refunded: true }, before), "refunded");
  assert.equal(referralState({ count: 1, deadline, refunded: true }, deadline + DAY), "refunded", "a friend leaving later changes nothing");
});

test("time left reads in days, then hours on the last day", () => {
  assert.equal(referralLeft(10 * DAY), "10 days left");
  assert.equal(referralLeft(6.2 * DAY), "7 days left");
  assert.equal(referralLeft(DAY), "1 day left");
  assert.equal(referralLeft(DAY - 1), "24 hours left");
  assert.equal(referralLeft(90 * 6e4), "2 hours left");
  assert.equal(referralLeft(30 * 6e4), "1 hour left");
  assert.equal(referralLeft(0), "time's up");
});

test("the link is the offer page with the code on it", () => {
  assert.equal(referralLink("https://www.klymb.ai", "ABCD2345"), "https://www.klymb.ai/system-design?ref=ABCD2345");
});

test("the offer is shown once per device, and that survives a reload", () => {
  const seen = fromStored(toStored({ ...defaultState(), onboarded: true, referralSeen: true }));
  assert.equal(seen.referralSeen, true);
  assert.equal(defaultState().referralSeen, false);
  assert.equal(fromStored({ onboarded: true }).referralSeen, false, "someone from before this existed still sees it");
});

test("a refund earned by referring keeps the course", () => {
  const payments = readFileSync("src/lib/payments.ts", "utf8");
  assert.match(payments, /enrollments\.finished_at is null and enrollments\.referral_earned_at is null/);
});

test("the migration adds what the code reads", () => {
  const sql = readFileSync("db/migrations/0021_referrals.sql", "utf8");
  for (const column of ["referral_code", "referral_earned_at", "referrer_email"]) assert.match(sql, new RegExp(`add column if not exists ${column}`));
  assert.match(sql, /create unique index if not exists enrollments_referral_code_idx/);
});
