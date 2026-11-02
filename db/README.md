# The database

klymb.ai and [app.klymb.ai](https://app.klymb.ai) share one Neon Postgres
database, so there is one user base rather than two. app.klymb.ai owns the
`public` schema through Prisma (148 models, 13k+ users); this app owns the
`course` schema, and the two meet at one foreign key:

```
course.learners.user_id  →  public."User".id
```

`course.learners.email` stays the operative key — it is the Google-verified
identity everything authorises against, and every query filters on it.
`user_id` is the link that makes a real join possible. It is null for a course
registrant with no app.klymb.ai account yet, which is fine; a registration here
never creates a platform account.

## Why a separate schema

- **Prisma stays out of our way.** app.klymb.ai's `schema.prisma` has no
  `multiSchema` and no `schemas` list, so Prisma manages `public` alone and
  never sees `course`. Our tables in `public` would read as drift, and
  `prisma migrate dev` would offer to reset them.
- **Blast radius.** The app connects as a role with privileges on `course` and
  nothing else. It is structurally unable to read or write the platform's
  tables, beyond `(id, email)` of `"User"` for the lookup above. That is
  tighter than the Supabase setup it replaced, where the service-role key
  bypassed row-level security on every table in the database.

Nothing collides by name either: Prisma's tables are `"User"`, `"Account"`…
while ours are `learners`, `registrations`…

## Setting it up

Do this against a **Neon branch of production** first, and repoint to
production only once the verification below passes.

1. **Confirm the target.** `ABtalksapp/.env.local` lists more than one Neon
   endpoint. Take the production one from the `abtalksapp` project's Vercel
   environment, not the local file, and confirm the 13k+ users are in it:

   ```sql
   select count(*) from "User";
   ```

2. **Create the application role**, as the database owner, with a password you
   generate. It is a secret, so it does not live in this repo:

   ```sql
   create role klymb_course with login password '<generated>';
   ```

3. **Apply the schema.** `DATABASE_MIGRATE_URL` is the owner connection (it
   needs to create tables); `DATABASE_URL` is the `klymb_course` one the app
   runs as. Both belong in `.env.local`, and the app's in Vercel.

   ```bash
   npm run db:migrate
   ```

   Migrations are applied in filename order, once each, recorded in
   `course.schema_migrations`. Each file runs in one transaction with its
   ledger row, so a failure leaves nothing behind. `0002_grants.sql` is a no-op
   until the role exists, so the order of steps 2 and 3 does not matter.

4. **Point `DATABASE_URL` at the `-pooler` host.** This database serves
   app.klymb.ai's users as well, and the connection budget is not ours alone to
   spend. The pool in `src/lib/db/client.ts` is deliberately small.

## Verifying

```sql
-- Ours are all in course, none in public.
select table_schema, count(*) from information_schema.tables
 where table_name in ('learners','registrations','payments','day_submissions',
                      'assessment_results','support_tickets','admin_audit_log',
                      'push_subscriptions','rate_limit_events','admin_users',
                      'enrollments','lesson_checks')
 group by table_schema;

-- As klymb_course: the first is refused, the second works.
select * from "User" limit 1;
select id, email from "User" limit 1;
```

In the app.klymb.ai checkout, `npx prisma migrate status` must report no drift:
that is what proves `course` is invisible to Prisma.

## Operations

Everything routine happens in one place: `/api/cron/followups`, hourly, from
`.github/workflows/followups.yml`. It calls `course.maintenance()` and then
refreshes a batch of commit counts, before it does anything with email — so
housekeeping still runs when email is not configured. Its JSON response says
what it did, which is the quickest way to see whether the cron is alive.

**`course.maintenance()`** deletes rate-limit attempts older than a day (in
bounded batches, so it never takes a long lock), creates the `sd_events`
partitions for the next couple of months, drops the ones that have aged
out, and deletes LinkedIn connections whose 60-day token has expired
(`0008_linkedin.sql` redefines it to add that last step).

**`course.sd_events` is partitioned by month.** It is the only table whose
growth is driven by visitors rather than enrolments — a free 21-day course
streaming events every few seconds adds up fast. Two consequences worth
knowing:

- **Retention is a `DROP TABLE`, not a `DELETE`.** Dropping a month is instant
  and gives the disk space back; deleting a month of rows is a long write
  transaction that leaves the space as bloat until a vacuum. Change the window
  by passing `p_keep_sd_months` to `maintenance()`. It keeps whole calendar
  months — the current one plus that many before it — so the real window is
  three to four months wide at the default of 3, not a flat ninety days.
- **There is a `default` partition** so an event with an unexpected date is
  never dropped. Nothing should normally land there. If something does, it
  permanently blocks creating the partition for that month, and
  `ensure_sd_partitions` will say so with a notice rather than failing the
  cron. Check with:

  ```sql
  select count(*) from course.sd_events_default;
  ```

**Commit counts are refreshed, not fetched.** `course.learners.commit_days`
is filled in by the cron, 150 learners per run, stalest first. It used to be
counted while the admin page rendered — one `commitDays()` per learner, each
making up to three GitHub requests, against a 5,000/hour budget shared with
the `checkFreshPush` call that learners need in order to submit. If the
numbers feel stale, raise `COMMIT_BATCH` in `src/lib/learner/commits.ts`; the
arithmetic for what that costs is in the comment above it. `commit_days` is
null when a learner has not been checked yet, which is different from zero
commits.

## Adding a migration

Merging one to `main` applies it to production: Vercel runs `scripts/vercel-build.sh`
on every production deploy, which migrates and then builds. That needs
`DATABASE_MIGRATE_URL` in Vercel, set for Production only and on the direct host,
because the runner's lock doesn't hold through `-pooler`. Without it the build stops
and the live version stays up. Previews never migrate, because they share this
database.

The migration goes in before the new code does, while the old code is still serving
learners, and this database serves app.klymb.ai too. So add rather than rename or
drop, and keep anything that locks a busy table out of an ordinary migration.

A new numbered file in `db/migrations/`. Never edit an applied one — the runner
warns when a file's checksum has changed, because the next environment will hit
it as a schema difference. Tables created later are usable by the app without
re-granting, via the default privileges set in `0002_grants.sql`.

Each file runs in a transaction. Put `-- migrate: no-transaction` on a line of
its own when it contains something Postgres refuses to run in one — in practice
`CREATE INDEX CONCURRENTLY`, which is how you add an index to a table large
enough that locking writes would be felt. Such a file is sent one statement at
a time and is responsible for being safe to re-run, since a failure part-way
leaves what it already did in place. If a concurrent build fails it leaves an
invalid index behind:

```sql
select indexrelid::regclass from pg_index where not indisvalid;
```

Drop what that lists, then run the migration again.

## History

`supabase/migrations/` is the retired Supabase schema. It is kept as history,
is applied nowhere, and `tests/migration.test.ts` pins what it said. Its
row-level security policies were already inert before the move: every one keyed
off `auth.jwt()` or `auth.uid()`, and this app authenticates with NextAuth and
Google without ever signing anyone into Supabase Auth.
