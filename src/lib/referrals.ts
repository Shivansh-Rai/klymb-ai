import "server-only";
import { randomInt } from "node:crypto";
import { site } from "@/data/config";
import { db, type Db } from "@/lib/db/client";
import { formatINR } from "@/lib/format";
import { MAIL_SUPPORT, sdReferralEarnedEmail, sendMail } from "@/lib/mail";
import {
  REFERRAL_ALPHABET, REFERRAL_CODE_LENGTH, SD_COURSE, SD_REFERRAL, referralDeadline, referralLeft, referralLink, referralState, type ReferralView,
} from "@/lib/sd-offer";

/** Postgres: a unique constraint refused the row. */
const UNIQUE_VIOLATION = "23505";

const newCode = () => Array.from({ length: REFERRAL_CODE_LENGTH }, () => REFERRAL_ALPHABET[randomInt(REFERRAL_ALPHABET.length)]).join("");

/** Their code, made on first use. A clash with someone else's just tries again. */
async function codeFor(sql: Db, email: string) {
  for (let tries = 0; tries < 3; tries++) {
    const { data, error } = await sql.row<{ referral_code: string }>`
      update course.enrollments
         set referral_code = coalesce(referral_code, ${newCode()}), updated_at = now()
       where email = ${email} and course = ${SD_COURSE}
      returning referral_code
    `;
    if (!error) return data?.referral_code ?? null;
    if (error.code !== UNIQUE_VIOLATION) return null;
  }
  return null;
}

/** A seat that can earn a refund: active, and paid for. A granted seat has no fee to give back. */
function paidSeat(sql: Db, email: string) {
  return sql.row<{ referral_code: string | null; created_at: string; amount: number; payment_status: string; name: string | null }>`
    select e.referral_code, e.created_at, p.amount, p.status as payment_status, l.name
      from course.enrollments e
      join course.payments p on p.id = e.payment_id
      left join course.sd_preregistrations l on l.email = e.email
     where e.email = ${email} and e.course = ${SD_COURSE} and e.status = 'active' and e.source = 'payment'
  `;
}

/**
 * Friends who count: each holds an active seat, bought through this person
 * before their window closed. One seat per email, so a friend counts once.
 */
async function friendCount(sql: Db, email: string, deadline: number) {
  const { data, error } = await sql.row<{ n: number }>`
    select count(*)::int as n
      from course.enrollments f
      join course.payments p on p.id = f.payment_id
     where p.referrer_email = ${email}
       and f.course = ${SD_COURSE} and f.status = 'active' and f.source = 'payment'
       and f.created_at < ${new Date(deadline).toISOString()}
  `;
  return { count: data?.n ?? 0, error };
}

const shortDate = (ms: number) =>
  new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Someone's referral offer, or null if they have no paid seat. Never throws: the course opens without it. */
export async function referralFor(email: string): Promise<ReferralView | null> {
  const sql = db();
  if (!sql) return null;
  const { data: seat, error } = await paidSeat(sql, email);
  if (error) console.error("referral read failed:", error.code, error.message);
  if (!seat) return null;

  const code = seat.referral_code ?? (await codeFor(sql, email));
  if (!code) return null;

  const deadline = referralDeadline(seat.created_at);
  const { count } = await friendCount(sql, email, deadline);
  const now = Date.now();
  return {
    code,
    link: referralLink(site.url, code),
    count,
    state: referralState({ count, deadline, refunded: seat.payment_status === "refunded" }, now),
    left: referralLeft(deadline - now),
    ends: shortDate(deadline),
    amount: formatINR(seat.amount / 100),
  };
}

/** The person behind a code, for checking an order. Null when the code isn't a live one. */
export async function referrerOf(sql: Db, code: string) {
  return sql.row<{ email: string; phone: string | null; name: string | null }>`
    select e.email, l.phone, l.name
      from course.enrollments e
      left join course.sd_preregistrations l on l.email = e.email
     where e.referral_code = ${code} and e.course = ${SD_COURSE} and e.status = 'active' and e.source = 'payment'
  `;
}

/** Who to name on the invite: a first name, or "A friend". Null when the code isn't a live one. */
export async function inviterFor(code: string) {
  const sql = db();
  if (!sql) return null;
  const { data, error } = await referrerOf(sql, code);
  if (error || !data) return null;
  return data.name?.trim().split(/\s+/)[0] || "A friend";
}

/**
 * After a paid order: if that was the referrer's third friend, marks their
 * refund earned. Set from null in one UPDATE, so of everything that lands here
 * for the same order (checkout, webhook, a retry) only one sends the email.
 */
export async function creditReferrer(sql: Db, orderId: string) {
  const { data: order, error } = await sql.row<{ referrer_email: string | null }>`
    select referrer_email from course.payments where razorpay_order_id = ${orderId} and status = 'paid'
  `;
  if (error || !order?.referrer_email) return { error };
  const email = order.referrer_email;

  const { data: seat, error: seatError } = await paidSeat(sql, email);
  if (seatError || !seat) return { error: seatError };

  const { count, error: countError } = await friendCount(sql, email, referralDeadline(seat.created_at));
  if (countError || count < SD_REFERRAL.friends) return { error: countError };

  const { data: claimed, error: claimError } = await sql.run`
    update course.enrollments set referral_earned_at = now(), updated_at = now()
     where email = ${email} and course = ${SD_COURSE} and referral_earned_at is null
  `;
  if (claimError || !claimed) return { error: claimError };

  const mail = sdReferralEarnedEmail({
    name: seat.name?.split(" ")[0] || "there",
    amount: formatINR(seat.amount / 100),
    siteUrl: site.url,
    supportEmail: MAIL_SUPPORT,
  });
  // Earned once per seat, so the address is a stable key: ABT-Mailer never sends it twice.
  const sent = await sendMail({ to: { email, name: seat.name ?? undefined }, ...mail, kind: "sd.referral_earned", idempotencyKey: email });
  if (!sent.ok) console.error("referral earned email failed:", email, sent.reason);
  return { error: null };
}
