-- ─────────────────────────────────────────────────────────────
--  System Design: the final assessment, graded on the server
--
--  course.final_attempts holds one row per try, written only after the server
--  has graded it. With course.lesson_checks it is the proof behind the refund:
--  the first three tries count, on the day the final is due. Keying on the
--  attempt number means a submit sent twice records one try, not two.
--
--  course.sd_release_notices remembers who has been told a lesson is out, so
--  the daily job never sends it twice.
--
--  Idempotent: safe to run more than once.
-- ─────────────────────────────────────────────────────────────

create table if not exists course.final_attempts (
  email text not null
    constraint final_attempts_email_lowercase check (email = lower(email)),
  course text not null check (course in ('system-design')),
  attempt integer not null check (attempt > 0),
  score smallint not null check (score between 0 and 100),
  -- 1 or 0 per question, for the results screen.
  results smallint[] not null,
  taken_at timestamptz not null default now(),
  primary key (email, course, attempt)
);

create table if not exists course.sd_release_notices (
  email text not null
    constraint sd_release_notices_email_lowercase check (email = lower(email)),
  lesson text not null,
  sent_at timestamptz not null default now(),
  primary key (email, lesson)
);
