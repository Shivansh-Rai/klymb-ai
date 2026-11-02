import "server-only";
import { after } from "next/server";
import { site } from "@/data/config";
import { grievance } from "@/data/legal";
import { CODE_TTL_MINUTES, redeemCode, requestCode, type Limiter, type RedeemResult, type RequestResult } from "@/lib/company/signin-code";
import { codeStore } from "@/lib/company/signin-store";
import { db } from "@/lib/db/client";
import { sendMail, signInCodeEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Wires the email-code rules in src/lib/company/signin-code.ts to the real
 * database, rate limiter and mailer.
 */

const limit: Limiter = async (rule, identity) =>
  (await checkRateLimit(rule.action, { limit: rule.limit, windowMinutes: rule.windowMinutes, identity })).allowed;

/** Step 1 of the company sign-in page. */
export async function requestSignInCode(rawEmail: unknown): Promise<RequestResult> {
  const sql = db();
  if (!sql) return { status: "unavailable" };
  return requestCode(rawEmail, {
    store: codeStore(sql),
    limit,
    secret: process.env.AUTH_SECRET,
    // Sent after the response, so how long the answer takes doesn't show
    // whether the email was invited.
    send: async (email, code) => after(() => deliverCode(email, code)),
  });
}

async function deliverCode(email: string, code: string) {
  const mail = signInCodeEmail({ code, minutes: CODE_TTL_MINUTES, siteUrl: site.url, supportEmail: grievance.email });
  // No idempotency key: every code is new, and a resent code must go out again.
  const result = await sendMail({ to: { email }, ...mail, kind: "company.signin_code" });
  if (result.ok) return;
  if (result.reason === "not configured" && process.env.NODE_ENV !== "production") {
    // Local development only, where email isn't set up. Never in production.
    console.info(`[dev] company sign-in code for ${email}: ${code}`);
    return;
  }
  // The reason only: never the code.
  console.error("company sign-in code email failed:", result.reason);
}

/** Step 2: called from the "email-code" provider's authorize in src/auth.ts. */
export async function redeemSignInCode(rawEmail: unknown, rawCode: unknown): Promise<RedeemResult> {
  const sql = db();
  if (!sql) return { ok: false, reason: "wrong" };
  return redeemCode(rawEmail, rawCode, { store: codeStore(sql), limit, secret: process.env.AUTH_SECRET });
}
