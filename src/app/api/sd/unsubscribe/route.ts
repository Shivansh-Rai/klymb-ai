import { db } from "@/lib/db/client";
import { SD_COURSE } from "@/lib/sd-offer";
import { emailFromToken } from "@/lib/sd-reminders";

export const dynamic = "force-dynamic";

/**
 * Turns off the System Design reminders, from the link in one.
 *
 * GET only shows a button: mail scanners open every link in a message, and a
 * link that acted on GET would unsubscribe people who never clicked it. POST
 * does it, from that button or from Gmail's one-click unsubscribe (RFC 8058),
 * which posts to the List-Unsubscribe URL with the token still in the query.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (!emailFromToken(token, process.env.AUTH_SECRET)) return page("This link isn't valid", "It may have been cut short. Use the link in your latest reminder, or reply to it and we'll turn them off for you.", 400);
  return page(
    "Turn off System Design reminders?",
    "You'll stop getting the evening reminder about your next lesson. Your seat, receipts and course access don't change.",
    200,
    `<form method="post"><button type="submit" style="margin-top:20px;padding:12px 24px;border:0;border-radius:999px;background:#83050b;color:#fff;font:700 15px/1 inherit;cursor:pointer">Turn off reminders</button></form>`,
  );
}

export async function POST(req: Request) {
  const email = emailFromToken(new URL(req.url).searchParams.get("t"), process.env.AUTH_SECRET);
  if (!email) return page("This link isn't valid", "Use the link in your latest reminder, or reply to it and we'll turn them off for you.", 400);
  const sql = db();
  const result = sql
    ? await sql.run`
        update course.enrollments set reminders_off_at = now(), updated_at = now()
         where email = ${email} and course = ${SD_COURSE} and reminders_off_at is null
      `
    : { error: { message: "no database" } };
  if (result.error) {
    console.error("sd unsubscribe failed:", result.error.message);
    return page("That didn't work", "Please try again in a minute, or reply to any reminder and we'll turn them off for you.", 500);
  }
  return page("Reminders are off", "You won't get the evening System Design reminders any more. Everything else about your course stays the same.", 200);
}

function page(title: string, body: string, status: number, extra = "") {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · Klymb.ai</title></head>
<body style="margin:0;background:#f3f2f2;color:#201e1d;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<main style="max-width:480px;margin:12vh auto;padding:32px 24px;background:#fff;border-radius:18px">
<div style="font-weight:900;letter-spacing:-0.5px">KLYMB<span style="color:#f0868b">.AI</span></div>
<h1 style="font-size:24px;line-height:1.2;margin:24px 0 8px">${title}</h1>
<p style="font-size:15px;line-height:1.6;color:#6b6866;margin:0">${body}</p>${extra}
</main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
