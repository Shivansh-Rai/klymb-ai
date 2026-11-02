import "server-only";
import { site } from "@/data/config";
import { grievance } from "@/data/legal";
import { getTrack } from "@/data/tracks";
import { formatINR } from "@/lib/format";
import { db } from "@/lib/db/client";
import { mailReady, sdReceiptEmail, sendMail, thankYouEmail } from "@/lib/mail";
import { referralFor } from "@/lib/referrals";
import { SD_COURSE } from "@/lib/sd-offer";

/**
 * Sends the thank-you email for one paid order, at most once.
 *
 * The row is claimed by setting receipt_sent_at from null in one UPDATE, so
 * two callers (a retried verify, a later webhook) can never both send. If the
 * send then fails, the claim is released so a later call can try again.
 */
export async function sendReceiptOnce(orderId: string) {
  const sql = db();
  if (!sql || !mailReady()) return;

  const { data: pay } = await sql.row<{
    id: string; email: string; track: string; amount: number;
    razorpay_payment_id: string | null; cohort_start: string;
  }>`
    update course.payments set receipt_sent_at = ${new Date().toISOString()}
     where razorpay_order_id = ${orderId} and status = 'paid' and receipt_sent_at is null
    returning id, email, track, amount, razorpay_payment_id, cohort_start
  `;
  if (!pay) return;

  const sd = pay.track === SD_COURSE;
  const { data: reg } = sd
    ? await sql.row<{ name: string }>`select name from course.sd_preregistrations where email = ${pay.email}`
    : await sql.row<{ name: string }>`
        select name from course.registrations
         where email = ${pay.email} and cohort_start = ${pay.cohort_start}
      `;

  const details = {
    name: reg?.name?.split(" ")[0] || "there",
    amount: formatINR(pay.amount / 100),
    paymentId: pay.razorpay_payment_id ?? orderId,
    siteUrl: site.url,
    supportEmail: grievance.email,
  };
  const referral = sd ? await referralFor(pay.email) : null;
  const mail = sd ? sdReceiptEmail({ ...details, referral: referral?.state === "open" ? referral : null }) : thankYouEmail({ ...details, trackName: getTrack(pay.track)?.name ?? pay.track });

  const sent = await sendMail({
    to: { email: pay.email, name: reg?.name ?? undefined },
    ...mail,
    kind: sd ? "sd.receipt" : "payment.receipt",
    // The order: a retry after a failed send is the same mail, so ABT-Mailer sends it once.
    idempotencyKey: orderId,
  });
  // A suppressed address (hard bounce) won't take it on a retry either, so the claim stays.
  if (!sent.ok && !sent.skipped) {
    console.error("thank-you email failed:", orderId, sent.reason);
    await sql.run`update course.payments set receipt_sent_at = null where id = ${pay.id}`;
  }
}
