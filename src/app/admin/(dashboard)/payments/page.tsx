import { EmptyState } from "@/components/admin/EmptyState";
import { PageTitle } from "@/components/admin/PageTitle";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { StatTile } from "@/components/admin/StatTile";
import { canRefund, REFUND_EMAIL } from "@/lib/admin/access";
import { requireAdmin } from "@/lib/admin/auth";
import { getPayments } from "@/lib/admin/data";
import { formatINR } from "@/lib/format";
import { SD_REFERRAL } from "@/lib/sd-offer";

export default async function AdminPaymentsPage() {
  const [admin, payments] = await Promise.all([requireAdmin(), getPayments()]);
  const paid = payments.filter((p) => p.status === "paid");
  const refunded = payments.filter((p) => p.status === "refunded");
  const pending = paid.filter((p) => p.refund_request);
  const referralDue = paid.filter((p) => !p.refund_request && (p.friends ?? 0) >= SD_REFERRAL.friends);
  const sum = (rows: typeof payments) => formatINR(rows.reduce((s, p) => s + p.amount, 0) / 100);

  return (
    <>
      <PageTitle
        eyebrow="Money"
        title="Payments & refunds"
        intro={`Completed payments, newest first. A refund returns the full amount to the learner's original payment method. On a 30-day track it is normally issued once the 30 days are over. On System Design it is issued when a learner finishes the course or ${SD_REFERRAL.friends} friends buy through their link, and a refund earned either way keeps their access. Only ${REFUND_EMAIL} can issue refunds, and every refund is recorded in Admin activity.`}
      />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Held" value={sum(paid)} hint={`${paid.length} paid payment${paid.length === 1 ? "" : "s"}`} />
        <StatTile label="Referral refunds due" value={referralDue.length} hint={`${SD_REFERRAL.friends} friends bought. Pay within 14 working days`} tone={referralDue.length ? "red" : "ink"} />
        <StatTile label="Refund pending" value={pending.length} hint="Requested, waiting for Razorpay" tone={pending.length ? "red" : "ink"} />
        <StatTile label="Refunded" value={sum(refunded)} hint={`${refunded.length} refund${refunded.length === 1 ? "" : "s"} confirmed`} tone="muted" />
      </div>
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" body="Every course is free right now, so there is nothing to refund. Payments appear here as soon as Razorpay confirms them." />
      ) : (
        <PaymentsTable rows={payments} canRefund={canRefund(admin)} />
      )}
    </>
  );
}
