import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { abtMailerCategory, interpretAbtMailerResponse, kindList, kindMatches, routesViaAbtMailer, signAbtMailerRequest } from "../src/lib/abt-mailer";

const ready = { ABT_MAILER_URL: "https://mailer.example", ABT_MAILER_HMAC_SECRET: "s".repeat(32) };

test("kinds match exactly, by prefix, or all", () => {
  assert.equal(kindMatches(kindList("sd.receipt"), "sd.receipt"), true);
  assert.equal(kindMatches(kindList("sd.*"), "sd.reminder.lesson"), true);
  assert.equal(kindMatches(kindList("sd.*"), "sdx.receipt"), false);
  assert.equal(kindMatches(kindList(" a , * "), "anything"), true);
  assert.equal(kindMatches(kindList(""), "sd.receipt"), false);
});

test("routes only listed kinds, only when configured, and the keep list wins", () => {
  assert.equal(routesViaAbtMailer("sd.receipt", { EMAIL_VIA_ABT_KINDS: "*" }), false, "no URL or secret");
  assert.equal(routesViaAbtMailer("sd.receipt", { ...ready }), false, "nothing listed");
  assert.equal(routesViaAbtMailer("sd.receipt", { ...ready, EMAIL_VIA_ABT_KINDS: "sd.*" }), true);
  assert.equal(routesViaAbtMailer("registration.welcome", { ...ready, EMAIL_VIA_ABT_KINDS: "sd.*" }), false);
  assert.equal(routesViaAbtMailer("sd.receipt", { ...ready, EMAIL_VIA_ABT_KINDS: "*", EMAIL_KEEP_ON_BREVO_KINDS: "sd.receipt" }), false);
});

test("receipts are essential, everything else isn't", () => {
  assert.equal(abtMailerCategory("sd.receipt"), "TRANSACTIONAL_ESSENTIAL");
  assert.equal(abtMailerCategory("payment.receipt"), "TRANSACTIONAL_ESSENTIAL");
  assert.equal(abtMailerCategory("sd.reminder.lesson"), "TRANSACTIONAL_NONESSENTIAL");
});

test("signs timestamp.body the way ABT-Mailer checks it", () => {
  const h = signAbtMailerRequest('{"a":1}', "secret", 1_700_000_000_000);
  assert.equal(h["X-ABTalks-Timestamp"], "1700000000");
  const want = createHmac("sha256", "secret").update('1700000000.{"a":1}').digest("hex");
  assert.equal(h["X-ABTalks-Signature"], `v1=${want}`);
});

test("only enqueued or duplicate count as sent; suppressed is a skip", () => {
  assert.deepEqual(interpretAbtMailerResponse(200, { status: "enqueued" }), { status: "SENT" });
  assert.deepEqual(interpretAbtMailerResponse(200, { status: "duplicate" }), { status: "SENT" });
  assert.equal(interpretAbtMailerResponse(200, { status: "suppressed", reason: "hard_bounce" }).status, "SKIPPED");
  assert.equal(interpretAbtMailerResponse(503, { status: "retry" }).status, "FAILED");
  assert.equal(interpretAbtMailerResponse(401, { error: "unauthorized" }).status, "FAILED");
  assert.equal(interpretAbtMailerResponse(200, null).status, "FAILED");
});
