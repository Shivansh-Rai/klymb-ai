import { NextResponse } from "next/server";
import { currentEmail } from "@/auth";
import { db } from "@/lib/db/client";
import { todayInIndia } from "@/lib/learn";
import { createOrder, razorpayKeys } from "@/lib/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { SD_COURSE, campaignOf, claimProblems, linkedInProblem, mobileOf, sdPriceFor, sdPriceNow, type SdRole } from "@/lib/sd-offer";
import { LIMITS, clamp } from "@/lib/validation";

/**
 * Creates the Razorpay order for a System Design seat.
 *
 * Who is paying comes from the Google session and the amount from the server,
 * so neither can be edited on the way. The page only calls this once they are
 * back from Google, which is where the email comes from. Their answers are saved first, keeping
 * any price they locked earlier: someone who claims during the offer keeps its
 * price even if they finish paying after it ends.
 */
export async function POST(req: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "Please sign in with Google again." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: unknown; phone?: unknown; linkedin?: unknown; role?: unknown; campaign?: unknown } | null;
  const name = clamp(body?.name, LIMITS.name);
  const phone = String(body?.phone ?? "");
  const role = String(body?.role ?? "");
  const linkedin = clamp(body?.linkedin, LIMITS.linkedin + 1);
  const missing = claimProblems({ name, phone, role });
  if (missing.length) return NextResponse.json({ error: `Add ${missing.join(", ")}.` }, { status: 400 });
  const badLink = linkedInProblem(linkedin);
  if (badLink) return NextResponse.json({ error: badLink }, { status: 400 });

  const limit = await checkRateLimit("sd_order", { limit: 10, windowMinutes: 60, identity: email });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const keys = razorpayKeys();
  const sql = db();
  if (!keys || !sql) return NextResponse.json({ error: "Payments are not available right now." }, { status: 500 });

  // Stops here if this can't be read: a payment with nowhere to record the seat would take money for nothing.
  const { data: seat, error: seatError } = await sql.row<{ id: string }>`
    select id from course.enrollments where email = ${email} and course = ${SD_COURSE} and status = 'active'
  `;
  if (seatError) return NextResponse.json({ error: "Payments are not available right now." }, { status: 500 });
  if (seat) return NextResponse.json({ error: "You already have this course.", enrolled: true }, { status: 409 });

  const now = new Date();
  const contact = `+91${mobileOf(phone)}`;
  const { data: lead, error: leadError } = await sql.row<{ locked_price: number }>`
    insert into course.sd_preregistrations (email, name, phone, linkedin, status, locked_price, consent)
    values (${email}, ${name}, ${contact}, ${linkedin || null}, ${role as SdRole}, ${sdPriceNow(now)}, false)
    on conflict (email) do update
      set name = excluded.name, phone = excluded.phone, status = excluded.status,
          linkedin = coalesce(excluded.linkedin, sd_preregistrations.linkedin), updated_at = now()
    returning locked_price
  `;
  if (leadError) {
    console.error("sd_preregistrations save failed:", leadError.code, leadError.message);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 500 });
  }

  const order = await createOrder(keys, {
    amount: sdPriceFor(lead?.locked_price, now) * 100,
    receipt: `klymb-sd-${Date.now().toString(36)}`,
    notes: { email, course: SD_COURSE },
  });
  if (!order.ok) {
    console.error("razorpay create order failed:", order.message);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: order.status });
  }

  const { error } = await sql.run`
    insert into course.payments (email, track, cohort_start, amount, currency, razorpay_order_id, campaign)
    values (${email}, ${SD_COURSE}, ${todayInIndia()}, ${order.amount}, ${order.currency}, ${order.id}, ${campaignOf(body?.campaign)})
  `;
  if (error) {
    console.error("payments insert failed:", error.code, error.message);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: keys.keyId,
    prefill: { name, email, contact },
  });
}
