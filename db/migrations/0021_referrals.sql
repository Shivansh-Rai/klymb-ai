-- ─────────────────────────────────────────────────────────────
--  System Design referrals: three friends buy, your fee comes back
--
--  course.enrollments.referral_code is the code in a buyer's link. It is made
--  the first time their link is read, never while a payment is being recorded,
--  so a problem with a code cannot stop a seat opening.
--
--  course.enrollments.referral_earned_at is set once, when the third friend
--  buys. A refund earned this way keeps the seat, like one earned by finishing.
--
--  course.payments.referrer_email is who referred an order, checked by the
--  server when the order is created. How many friends someone has is always
--  counted from the seats themselves, so the count can't drift when one ends.
--
--  Idempotent: safe to run more than once.
-- ─────────────────────────────────────────────────────────────

alter table course.enrollments add column if not exists referral_code text;
alter table course.enrollments add column if not exists referral_earned_at timestamptz;

create unique index if not exists enrollments_referral_code_idx
  on course.enrollments (referral_code) where referral_code is not null;

alter table course.payments add column if not exists referrer_email text;

alter table course.payments drop constraint if exists payments_referrer_email_lowercase;
alter table course.payments add constraint payments_referrer_email_lowercase
  check (referrer_email = lower(referrer_email));

create index if not exists payments_referrer_idx
  on course.payments (referrer_email) where referrer_email is not null;
