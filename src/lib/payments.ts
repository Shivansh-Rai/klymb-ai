import "server-only";
import { type Db } from "@/lib/db/client";
import { SD_COURSE } from "@/lib/sd-offer";

/**
 * Records a paid order and, when it bought a course, opens that course.
 *
 * The checkout's verify call and Razorpay's webhook both land here, in either
 * order and sometimes twice, so it is one statement and safe to repeat. The
 * status guard is what stops a replayed checkout signature turning a refund
 * back into a payment: no row comes back for a refunded order.
 */
export function recordPaid(sql: Db, orderId: string, paymentId: string) {
  return sql.row<{ id: string }>`
    with paid as (
      update course.payments
         set status = 'paid', razorpay_payment_id = ${paymentId}, updated_at = now()
       where razorpay_order_id = ${orderId} and status in ('created', 'failed', 'paid')
      returning id, email, track
    ), enrolled as (
      insert into course.enrollments (email, user_id, course, source, payment_id)
      select paid.email, u.id, paid.track, 'payment', paid.id
        from paid
        left join public."User" u on u.email = paid.email
       where paid.track = ${SD_COURSE}
      on conflict (email, course) do update
        set status = 'active', source = 'payment', payment_id = excluded.payment_id, updated_at = now()
    )
    select id from paid
  `;
}

/** Marks a payment refunded and ends the access it bought, unless the refund was earned by finishing. */
export function recordRefund(sql: Db, paymentId: string) {
  return sql.run`
    with refunded as (
      update course.payments
         set status = 'refunded', updated_at = now()
       where razorpay_payment_id = ${paymentId}
      returning id
    )
    update course.enrollments
       set status = 'refunded', updated_at = now()
      from refunded
     where enrollments.payment_id = refunded.id and enrollments.finished_at is null
  `;
}
