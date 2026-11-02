import { createHmac } from "node:crypto";

/**
 * Mail through ABT-Mailer, the team's SES sender (github.com/manuVrtti/ABT-mailer,
 * where Klymb is one of the sending brands). Ported from ABtalksapp's
 * src/lib/abt-mailer.ts, plans 185 and 186.
 *
 * Only the kinds listed in EMAIL_VIA_ABT_KINDS go this way; everything else
 * stays on Brevo. An entry may be `*` (every kind) or `prefix.*` (`sd.*`), and
 * EMAIL_KEEP_ON_BREVO_KINDS, in the same syntax, wins. Clearing the variable
 * moves everything back to Brevo with no code change.
 *
 * Contract: POST {ABT_MAILER_URL}/api/emails/transactional in "raw" mode (we
 * send the rendered subject, html and text), HMAC-SHA256 over
 * `${timestamp}.${body}`. See ABT-Mailer's docs/api/transactional-email.md.
 * ABT-Mailer never sends the same (eventId, kind, email) twice, and stops mail
 * to addresses that hard-bounced or complained on its own.
 */

export type AbtMailerOutcome =
  | { status: "SENT" }
  | { status: "SKIPPED"; reason: string }
  | { status: "FAILED"; error: Error };

const TIMEOUT_MS = 10_000;

/** The patterns in a comma-separated env value. */
export function kindList(raw: string | undefined): Set<string> {
  return new Set((raw ?? "").split(",").map((k) => k.trim()).filter(Boolean));
}

/** True when `kind` matches an entry: exact, `*`, or `prefix.*`. */
export function kindMatches(patterns: Set<string>, kind: string): boolean {
  if (patterns.has("*") || patterns.has(kind)) return true;
  for (const p of patterns) {
    if (p.endsWith(".*") && kind.startsWith(p.slice(0, -1))) return true;
  }
  return false;
}

export function abtMailerReady(env: Record<string, string | undefined> = process.env) {
  return !!env.ABT_MAILER_URL && !!env.ABT_MAILER_HMAC_SECRET;
}

export function routesViaAbtMailer(kind: string, env: Record<string, string | undefined> = process.env): boolean {
  if (!abtMailerReady(env)) return false;
  if (kindMatches(kindList(env.EMAIL_KEEP_ON_BREVO_KINDS), kind)) return false;
  return kindMatches(kindList(env.EMAIL_VIA_ABT_KINDS), kind);
}

/**
 * Mail the recipient must get even after turning off optional mail: a record
 * of money they paid. ABT-Mailer only lets a hard bounce stop these.
 */
const ESSENTIAL_KINDS = kindList("payment.receipt,sd.receipt");

export function abtMailerCategory(kind: string): "TRANSACTIONAL_ESSENTIAL" | "TRANSACTIONAL_NONESSENTIAL" {
  return kindMatches(ESSENTIAL_KINDS, kind) ? "TRANSACTIONAL_ESSENTIAL" : "TRANSACTIONAL_NONESSENTIAL";
}

export function signAbtMailerRequest(body: string, secret: string, nowMs: number = Date.now()): Record<string, string> {
  const ts = Math.floor(nowMs / 1000).toString();
  const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  return {
    "Content-Type": "application/json",
    "X-ABTalks-Timestamp": ts,
    "X-ABTalks-Signature": `v1=${sig}`,
  };
}

/** ABT-Mailer answers 200 with a `status`; only "enqueued" and "duplicate" mean the mail is on its way. */
export function interpretAbtMailerResponse(httpStatus: number, json: unknown): AbtMailerOutcome {
  const body = (json && typeof json === "object" ? json : {}) as { status?: string; reason?: string; error?: string };
  if (httpStatus === 200 && (body.status === "enqueued" || body.status === "duplicate")) return { status: "SENT" };
  if (httpStatus === 200 && body.status === "suppressed") {
    return { status: "SKIPPED", reason: `ABT-Mailer suppressed: ${body.reason ?? "unknown"}` };
  }
  const what = body.status ?? body.error ?? "unknown";
  return { status: "FAILED", error: new Error(`ABT-Mailer ${httpStatus} ${what}${body.reason ? `: ${body.reason}` : ""}`) };
}

export async function sendViaAbtMailer(input: {
  kind: string;
  /** The same on every retry of this mail, so ABT-Mailer never sends it twice. */
  idempotencyKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  from: { email: string; name: string };
  replyTo: string;
}): Promise<AbtMailerOutcome> {
  const url = process.env.ABT_MAILER_URL;
  const secret = process.env.ABT_MAILER_HMAC_SECRET;
  if (!url || !secret) return { status: "SKIPPED", reason: "ABT_MAILER_URL / ABT_MAILER_HMAC_SECRET missing" };

  const body = JSON.stringify({
    eventType: input.kind,
    eventId: input.idempotencyKey,
    recipient: { email: input.to },
    content: { subject: input.subject, html: input.html, text: input.text, headers: input.headers },
    category: abtMailerCategory(input.kind),
    overrides: { fromEmail: input.from.email, fromName: input.from.name, replyTo: input.replyTo },
  });

  try {
    const res = await fetch(new URL("/api/emails/transactional", url), {
      method: "POST",
      headers: signAbtMailerRequest(body, secret),
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const json: unknown = await res.json().catch(() => null);
    return interpretAbtMailerResponse(res.status, json);
  } catch (error) {
    return { status: "FAILED", error: error instanceof Error ? error : new Error(String(error)) };
  }
}
