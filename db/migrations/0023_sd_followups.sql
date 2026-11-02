-- ─────────────────────────────────────────────────────────────
--  System Design: follow-ups for a claim that wasn't paid
--
--  Someone who fills in the claim form and opens Razorpay but doesn't pay
--  gets up to three emails, 1 hour, 1 day and 3 days after they started, the
--  same schedule as the 30-day tracks (lib/followups). A seat ends it.
--
--  course.sd_preregistrations
--    followup_stage    0 = none sent, 1..3 = that follow-up sent. Claimed
--                      before the send, so a re-run never sends one twice.
--    followup_sent_at  when the last one went.
--
--  Rows already here start as done: the sequence is for claims made from now
--  on, not a burst of "finish your payment" to everyone who ever claimed.
--
--  Idempotent: safe to run more than once.
-- ─────────────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'course' and table_name = 'sd_preregistrations' and column_name = 'followup_stage'
  ) then
    alter table course.sd_preregistrations add column followup_stage smallint not null default 0;
    alter table course.sd_preregistrations add column followup_sent_at timestamptz;
    update course.sd_preregistrations set followup_stage = 3;
  end if;
end $$;
