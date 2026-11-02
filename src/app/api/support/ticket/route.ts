import { NextResponse } from "next/server";
import { currentEmail } from "@/auth";
import { normaliseEmail } from "@/lib/email";
import { sendMail } from "@/lib/mail";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { SUPPORT_EMAIL } from "@/data/support-faq";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Kamran's "Ask the team": saves a ticket for /admin/support and emails
 * team@klymb.ai with reply-to set to the learner. Five per hour per caller.
 * A signed-in learner's own email wins over whatever was typed.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (str(body?.website, 200)) return NextResponse.json({ ok: true }); // honeypot

  const email = normaliseEmail(await currentEmail()) ?? normaliseEmail(body?.email);
  const name = str(body?.name, 80);
  const message = str(body?.message, 2000);
  const page = str(body?.page, 200);
  const raw = (typeof body?.context === "object" && body.context ? body.context : {}) as Record<string, unknown>;
  // Only the known progress fields, short and flat: never trust a free-form blob.
  const context: Record<string, string> = {};
  for (const k of ["track", "day", "submitted", "streak", "lock", "rework", "missing", "lastQuestion"]) {
    const v = raw[k];
    if (typeof v === "string" || typeof v === "number") context[k] = String(v).slice(0, 200);
    else if (Array.isArray(v)) context[k] = v.slice(0, 30).map(String).join(", ").slice(0, 200);
  }
  if (!email) return NextResponse.json({ error: "Add an email we can reply to." }, { status: 400 });
  if (message.length < 5) return NextResponse.json({ error: "Tell us a little more." }, { status: 400 });

  const limit = await checkRateLimit("support-ticket", { limit: 5, windowMinutes: 60 });
  if (!limit.allowed) return NextResponse.json({ error: "You've sent a few already. We'll reply soon." }, { status: 429 });

  const sql = db();
  const { data, error } = sql
    ? await sql.row<{ id: string }>`
        insert into course.support_tickets (email, name, message, page, context)
        values (${email}, ${name || null}, ${message}, ${page || null}, ${JSON.stringify(context)}::jsonb)
        returning id
      `
    : { data: null, error: { message: "no database" } };
  if (error) console.error("support ticket save failed:", error.message);

  const lines = Object.entries(context).map(([k, v]) => `${k}: ${v}`);
  const mail = await sendMail({
    to: { email: SUPPORT_EMAIL, name: "Klymb team" },
    replyTo: email,
    kind: "support.ticket",
    ...(data?.id ? { idempotencyKey: data.id } : {}),
    subject: `Kamran help request from ${name || email}`,
    text: `${message}\n\nFrom: ${name} <${email}>\nPage: ${page}\n${lines.join("\n")}`,
    html: `<p style="white-space:pre-wrap">${esc(message)}</p><hr><p>From: ${esc(name)} &lt;${esc(email)}&gt;<br>Page: ${esc(page)}<br>${lines.map(esc).join("<br>")}</p><p>Reply to the learner at ${esc(email)}.</p>`,
  });
  if (!mail.ok) console.error("support ticket email failed:", mail.reason);

  if (error && !mail.ok) return NextResponse.json({ error: `Couldn't send right now. Email ${SUPPORT_EMAIL} directly.` }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
