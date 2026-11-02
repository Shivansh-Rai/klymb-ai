-- ─────────────────────────────────────────────────────────────
--  System Design sales: who may open the course, and what they proved
--
--  course.enrollments is who may open a paid course. It sits apart from
--  course.learners, which is a seat on a 30-day track: System Design is not a
--  track, and someone on a track can buy it too.
--
--  course.lesson_checks holds one row per person per lesson, written only
--  after the server has graded the attempt. It is the proof behind "100% back
--  on finishing", so nothing a browser says can create a pass. It is keyed by
--  email rather than by enrolment because Day 0 is free: a pass earned before
--  buying still counts afterwards.
--
--  course.payments takes System Design orders, and remembers the campaign
--  that brought the buyer.
--
--  course.sd_preregistrations now also holds the claim form's answers, and
--  gains the optional LinkedIn profile that form asks for.
--
--  Idempotent: safe to run more than once.
-- ─────────────────────────────────────────────────────────────

create table if not exists course.enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null
    constraint enrollments_email_lowercase check (email = lower(email)),
  -- Their app.klymb.ai account, when they have one. Null otherwise.
  user_id text references public."User" (id) on delete set null,
  course text not null check (course in ('system-design')),
  status text not null default 'active'
    check (status in ('active', 'refunded', 'revoked')),
  -- 'grant' is access given by hand: the team's own testing, a support case.
  source text not null check (source in ('payment', 'grant')),
  payment_id uuid references course.payments (id),
  -- Set when they earn the refund. Someone refunded for finishing keeps access.
  finished_at timestamptz,
  unique (email, course)
);

create index if not exists enrollments_payment_idx
  on course.enrollments (payment_id) where payment_id is not null;

create table if not exists course.lesson_checks (
  email text not null
    constraint lesson_checks_email_lowercase check (email = lower(email)),
  course text not null check (course in ('system-design')),
  lesson text not null,
  best_score smallint not null check (best_score between 0 and 100),
  attempts integer not null default 1,
  -- Null until an attempt passes.
  passed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (email, course, lesson)
);

alter table course.payments add column if not exists campaign text;

alter table course.sd_preregistrations add column if not exists linkedin text;

alter table course.payments drop constraint if exists payments_track_check;
alter table course.payments add constraint payments_track_check
  check (track in ('qa-engineer','l1-l2-support','project-manager','junior-developer','reporting-analyst','ai-product-manager','system-design'));
