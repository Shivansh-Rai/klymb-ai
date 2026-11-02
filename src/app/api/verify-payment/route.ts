import { after, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { recordPaid } from "@/lib/payments";
import { razorpayKeys, signatureValid } from "@/lib/razorpay";
import { sendReceiptOnce } from "@/lib/receipt";

const field = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 200 ? v : null);

/** Marks an order paid, but only when Razorpay's checkout signature verifies. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = field(body?.razorpay_order_id);
  const paymentId = field(body?.razorpay_payment_id);
  const signature = field(body?.razorpay_signature);
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keys = razorpayKeys();
  const sql = db();
  if (!keys || !sql) return NextResponse.json({ error: "Payments are not available right now." }, { status: 500 });

  if (!signatureValid(orderId, paymentId, signature, keys.keySecret)) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const { data, error } = await recordPaid(sql, orderId, paymentId);
  if (error || !data) {
    console.error("payments update failed:", orderId, error?.code, error?.message);
    return NextResponse.json({ error: "Payment received but not recorded. Email us with your payment ID." }, { status: 500 });
  }

  // The thank-you email goes after the response, so the learner is not kept waiting on it.
  after(() => sendReceiptOnce(orderId));

  return NextResponse.json({ ok: true });
}
