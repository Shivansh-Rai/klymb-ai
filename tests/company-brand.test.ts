import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { RESEND_LIMITS, contrastWithWhite, inviteSenderName, readableBrandColor } from "../src/lib/company/brand";

// Invite emails in the company's look, and the HR "Resend invite" button.

const read = (p: string) => readFileSync(p, "utf8");

test("contrastWithWhite matches the WCAG figures", () => {
  assert.equal(Math.round(contrastWithWhite("#000000")), 21);
  assert.equal(Math.round(contrastWithWhite("#ffffff")), 1);
  assert.ok(contrastWithWhite("#83050b") > 10, "Klymb maroon is very readable");
});

test("readableBrandColor keeps a dark color and drops one white text can't sit on", () => {
  assert.equal(readableBrandColor("#1A56DB"), "#1a56db", "a dark blue is kept (and lowercased)");
  assert.equal(readableBrandColor("#0b6e4f"), "#0b6e4f");
  assert.equal(readableBrandColor("#ffd400"), null, "yellow falls back to Klymb maroon");
  assert.equal(readableBrandColor("#f0f0f0"), null);
  assert.equal(readableBrandColor("#767676"), "#767676", "just passes 4.5:1");
  assert.equal(readableBrandColor("#777777"), null, "just fails 4.5:1");
});

test("readableBrandColor refuses anything that isn't #rrggbb, so nothing odd reaches the email's styles", () => {
  for (const bad of [null, undefined, "", "1a56db", "#1a56d", "red", "#1a56db;background:url(x)", "#gggggg"]) {
    assert.equal(readableBrandColor(bad), null, String(bad));
  }
});

test("inviteSenderName reads 'Acme via Klymb.ai' and can't break the From header", () => {
  assert.equal(inviteSenderName("Acme"), "Acme via Klymb.ai");
  assert.equal(inviteSenderName('  Acme   "Labs" <ceo@acme.com> '), "Acme Labs ceoacme.com via Klymb.ai");
  assert.equal(inviteSenderName("Acme\r\nBcc: x"), "Acme Bcc: x via Klymb.ai");
  assert.equal(inviteSenderName('"<>"'), "Klymb.ai", "nothing left falls back to Klymb.ai");
  assert.ok(inviteSenderName("x".repeat(200)).length <= 60 + " via Klymb.ai".length);
});

test("resend limits: one per person per 10 minutes, 50 per HR per hour", () => {
  assert.deepEqual(RESEND_LIMITS.perPerson, { limit: 1, windowMinutes: 10 });
  assert.deepEqual(RESEND_LIMITS.perHr, { limit: 50, windowMinutes: 60 });
});

test("mail: the From address is always Klymb's; only the display name can change, and it defaults to Klymb.ai", () => {
  const mail = read("src/lib/mail.ts");
  assert.match(mail, /const SENDER_NAME = "Klymb\.ai"/);
  assert.match(mail, /fromName = SENDER_NAME/);
  // Brevo and ABT-Mailer both send the same display name.
  assert.match(mail, /sender: \{ email: from, name: fromName \}/);
  assert.match(mail, /from: \{ email: from, name: fromName \}/);
  assert.doesNotMatch(mail, /name: SENDER_NAME \}/);
});

test("mail: the company invite uses the checked color, the escaped logo and the safe sender name", () => {
  const mail = read("src/lib/mail.ts");
  const fn = mail.slice(mail.indexOf("export function companyInviteEmail"));
  assert.match(fn, /readableBrandColor\(p\.company\.brandColor\) \?\? C\.maroon/);
  assert.match(fn, /fromName: inviteSenderName\(company\)/);
  assert.match(mail, /src="\$\{esc\(brand\.logoUrl\)\}"/);
  assert.match(mail, /alt="\$\{esc\(brand\.name\)\}"/);
});

test("mail: emails without a brand keep Klymb's header and footer", () => {
  const mail = read("src/lib/mail.ts");
  assert.match(mail, /if \(!brand\) \{\s+return `<td[^`]*klymb-icon\.png/);
  assert.match(mail, /Career tracks/);
  for (const fn of ["thankYouEmail", "welcomeEmail", "inviteEmail", "signInCodeEmail", "noteEmail"]) {
    const body = mail.slice(mail.indexOf(`export function ${fn}(`), mail.indexOf("\n}\n", mail.indexOf(`export function ${fn}(`)));
    assert.doesNotMatch(body, /brand/, `${fn} stays Klymb-branded`);
  }
});

test("both invite senders pass the company's brand", () => {
  assert.match(read("src/app/admin/company-actions.ts"), /company: \{ name: c\.name, logoUrl: c\.logo_url, brandColor: c\.brand_color \}/);
  const people = read("src/app/org/[slug]/people/actions.ts");
  assert.match(people, /sendCompanyInvite\(\{ email: p\.email, name: p\.name, company, role: p\.role \}\)/);
});

test("resend is HR-only, for active people, and limited per person and per HR before anything is sent", () => {
  const src = read("src/app/org/[slug]/people/actions.ts");
  const fn = src.slice(src.indexOf("export async function resendInvite"));
  const at = (s: string) => { const i = fn.indexOf(s); assert.ok(i >= 0, s); return i; };
  assert.ok(at("hrFor(slug)") < at("loadPerson("));
  assert.ok(at("target.removed") < at('checkRateLimit("company_invite_resend"'));
  assert.ok(at('checkRateLimit("company_invite_resend"') < at("sendCompanyInvite("));
  assert.ok(at('checkRateLimit("company_invite_resend_hr"') < at("sendCompanyInvite("));
  assert.match(fn, /identity: `\$\{hr\.companyId\}:\$\{email\}`/);
  assert.match(fn, /identity: hr\.email/);
  assert.match(fn, /resend: true/);
});
