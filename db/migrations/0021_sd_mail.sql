-- ─────────────────────────────────────────────────────────────
--  System Design mail: the 8 PM reminder and the pre-registrant invite
--
--  No new tables, only what each mail needs to remember about the person:
--
--  course.enrollments
--    reminders_off_at  set when they turn reminders off from the link in one.
--    reminded_on       the IST date of the last reminder. Claimed before the
--                      send, so a re-run of the job never mails anyone twice
--                      in a day, whichever provider sends it.
--    reminder_streak   reminders in a row without a passed lesson. Sets the
--                      cadence: daily, then every third day, then weekly.
--
--  course.sd_preregistrations
--    invited_at        when the "it's open, your price is held" mail went to
--                      someone who pre-registered before payments opened.
--
--  Idempotent: safe to run more than once.
-- ─────────────────────────────────────────────────────────────

alter table course.enrollments add column if not exists reminders_off_at timestamptz;
alter table course.enrollments add column if not exists reminded_on date;
alter table course.enrollments add column if not exists reminder_streak smallint not null default 0;

alter table course.sd_preregistrations add column if not exists invited_at timestamptz;
