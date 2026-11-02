import { after, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { recordPaid, recordRefund } from "@/lib/payments";
import { webhookAction, webhookSignatureValid } from "@/lib/razorpay-webhook";
import { sendReceiptOnce } from "@/lib/receipt";

/**
 * Razorpay's server-to-server confirmation.
 *
 * The checkout's verify call can be lost (tab closed, network drop after
 * paying), so this records the payment independently. Every update is
 * idempotent: Razorpay retries, and events can arrive in any order.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const sql = db();
  if (!secret || !sql) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const raw = await req.text();
  if (!webhookSignatureValid(raw, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let body: Parameters<typeof webhookAction>[0];
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const action = webhookAction(body);
  const now = new Date().toISOString();

  if (action.kind === "paid") {
    const { error } = await recordPaid(sql, action.orderId, action.paymentId);
    if (error) {
      console.error("webhook paid update failed:", action.orderId, error.code);
      return NextResponse.json({ error: "Retry" }, { status: 500 }); // Razorpay retries non-2xx
    }
    after(() => sendReceiptOnce(action.orderId));
  } else if (action.kind === "failed") {
    // A failed attempt only marks an order nobody has paid yet; the learner can retry.
    await sql.run`
      update course.payments set status = 'failed', updated_at = ${now}
       where razorpay_order_id = ${action.orderId} and status = 'created'
    `;
  } else if (action.kind === "refunded") {
    const { error } = await recordRefund(sql, action.paymentId);
    if (error) return NextResponse.json({ error: "Retry" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
