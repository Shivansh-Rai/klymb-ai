"use client";

import { useState } from "react";
import { refund } from "@/app/admin/payment-actions";
import { daysUntilCohortEnds, REFUND_EMAIL } from "@/lib/admin/access";
import type { PaymentRow } from "@/lib/admin/data";
import { formatINR } from "@/lib/format";
import { SD_COURSE, SD_REFERRAL } from "@/lib/sd-offer";

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function PaymentsTable({ rows, canRefund }: { rows: PaymentRow[]; canRefund: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((p) => p.email.toLowerCase().includes(q) || p.razorpay_payment_id?.toLowerCase().includes(q)) : rows;

  return (
    <div className="flex flex-col gap-3">
    <label className="flex max-w-sm flex-col gap-1 text-xs font-bold">
      Find a payment
      <input
        type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email or pay_… ID"
        autoComplete="off" spellCheck={false}
        className="border border-line/60 bg-white px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none"
      />
    </label>
    <div className="overflow-x-auto rounded-xl border border-line/40 bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line/40 text-xs font-extrabold uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3">Paid</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Track</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment ID</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted">No payment matches “{query}”.</td></tr>
          )}
          {shown.map((p) => (
            <tr key={p.id} className="border-b border-line/20 last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">{dateTime(p.created_at)}</td>
              <td className="px-4 py-3">
                {p.email}
                {p.referred_by && <span className="block text-xs text-muted">Referred by {p.referred_by}</span>}
              </td>
              <td className="px-4 py-3">{p.track}</td>
              <td className="px-4 py-3 font-bold">{formatINR(p.amount / 100)}</td>
              <td className="px-4 py-3 font-mono text-xs">{p.razorpay_payment_id}</td>
              <td className="px-4 py-3"><RefundCell payment={p} canRefund={canRefund} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

/** Where a paid System Design buyer stands on referrals. A friend whose seat ended stops counting, so this is what to check before refunding. */
function ReferralBadge({ payment }: { payment: PaymentRow }) {
  const { friends, referral_earned_at: earned } = payment;
  if (friends === null || (!friends && !earned)) return null;
  const due = friends >= SD_REFERRAL.friends;
  return (
    <span className={`text-xs font-bold ${due ? "text-red-deep" : "text-muted"}`}>
      {Math.min(friends, SD_REFERRAL.friends)}/{SD_REFERRAL.friends} friends{due ? ", refund due" : earned ? ": a friend's seat ended" : ""}
    </span>
  );
}

function RefundCell({ payment, canRefund }: { payment: PaymentRow; canRefund: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  if (payment.status === "refunded") return <span className="text-xs font-bold uppercase tracking-wider text-muted">Refunded</span>;
  if (requested) return <span className="text-xs font-bold text-ink">Refund requested. It shows as Refunded once Razorpay confirms.</span>;
  if (payment.refund_request) {
    return (
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-red-deep">Refund pending</span>
        <span className="text-xs text-muted">Requested by {payment.refund_request.by}, {dateTime(payment.refund_request.at)}. Waiting for Razorpay.</span>
      </span>
    );
  }
  if (!canRefund) {
    return (
      <span className="flex flex-col items-start gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-ink">Paid</span>
        <ReferralBadge payment={payment} />
        <span className="text-xs text-muted">Refunds only from {REFUND_EMAIL}</span>
      </span>
    );
  }
  // System Design has no cohort: its cohort_start is just the day of the order.
  const daysLeft = payment.track === SD_COURSE ? 0 : daysUntilCohortEnds(payment.cohort_start);

  return (
    <span className="flex flex-col items-start gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-ink">Paid</span>
      <ReferralBadge payment={payment} />
      {confirming ? (
        <>
          {daysLeft > 0 && (
            <span className="max-w-[16rem] text-xs font-semibold text-red-deep">
              Early: this learner&apos;s 30 days end in {daysLeft} day{daysLeft === 1 ? "" : "s"}. Refunds are normally issued after the cohort.
            </span>
          )}
          <label htmlFor={`refund-${payment.id}`} className="text-xs font-bold text-red-deep">
            Type {payment.email} to refund {formatINR(payment.amount / 100)}
          </label>
          <input
            id={`refund-${payment.id}`} value={typed} onChange={(e) => setTyped(e.target.value)}
            autoComplete="off" spellCheck={false}
            className="w-56 border-2 border-red-deep bg-white px-2 py-1 text-xs focus:outline-none"
          />
          <span className="flex gap-2">
            <button
              type="button" disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                const result = await refund(payment.id, typed);
                setBusy(false);
                if (result.ok) setRequested(true);
                else setError(result.message);
              }}
              className="border-2 border-red-deep bg-red-deep px-2 py-1 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
            >
              {busy ? "Refunding…" : "Refund"}
            </button>
            <button
              type="button" onClick={() => { setConfirming(false); setTyped(""); setError(""); }}
              className="rounded-md border border-line/50 px-2 py-1 text-xs font-bold"
            >
              Cancel
            </button>
          </span>
        </>
      ) : (
        <button
          type="button" onClick={() => setConfirming(true)}
          className="text-xs font-bold uppercase tracking-wider text-muted underline underline-offset-2 hover:text-red-deep"
        >
          Refund…
        </button>
      )}
      {error && <span role="alert" className="max-w-[16rem] text-xs font-semibold text-error">{error}</span>}
    </span>
  );
}
