import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";

/**
 * The live schema: course.* on the Neon database that runs app.klymb.ai.
 * tests/migration.test.ts covers the retired Supabase migrations, which stay
 * in supabase/migrations/ as history and are no longer applied anywhere.
 */
const dir = "db/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const init = readFileSync(`${dir}/0001_init.sql`, "utf8");
const grants = readFileSync(`${dir}/0002_grants.sql`, "utf8");
/** Every migration, so the invariants below apply to new ones too. */
const all = files.map((f) => readFileSync(`${dir}/${f}`, "utf8")).join("\n");

/**
 * Executable SQL only. These files explain in prose what was dropped on the
 * way over from Supabase, naming auth.uid() and the anon role, so an
 * assertion that those are gone has to look past the commentary.
 */
const code = (sql: string) => sql.replace(/--.*$/gm, "");
const initCode = code(init);
const grantsCode = code(grants);
const allCode = code(all);

const TABLES = [
  "registrations", "admin_users", "learners", "day_submissions", "assessment_results",
  "payments", "push_subscriptions", "support_tickets", "admin_audit_log", "rate_limit_events",
];
/** Added by 0003 when the System Design course landed on main. */
const SD_TABLES = ["sd_events", "sd_feedback"];

test("migrations are ordered and uniquely numbered", () => {
  const numbers = files.map((f) => f.slice(0, 4));
  assert.equal(new Set(numbers).size, numbers.length, "two migrations share a number");
  assert.deepEqual([...numbers].sort(), numbers);
});

test("every table is created in the course schema", () => {
  assert.match(init, /create schema if not exists course/);
  for (const table of [...TABLES, ...SD_TABLES]) {
    assert.match(all, new RegExp(`create table if not exists course\\.${table} \\(`), `${table} is missing`);
  }
});

test("no migration creates a table outside the course schema", () => {
  // Applies to every file, so a later one cannot quietly reintroduce public.
  const created = [...allCode.matchAll(/create table (?:if not exists )?([a-z_]+)\./g)].map((m) => m[1]);
  assert.ok(created.length > 0, "no create table statements found");
  assert.deepEqual([...new Set(created)], ["course"]);
});

test("nothing is created in public, which belongs to app.klymb.ai's Prisma", () => {
  // Prisma manages public alone; a table of ours there would read as drift and
  // invite `prisma migrate dev` to offer to reset it.
  for (const sql of [initCode, grantsCode]) {
    assert.doesNotMatch(sql, /create table (if not exists )?public\./);
    assert.doesNotMatch(sql, /create (or replace )?function public\./);
    assert.doesNotMatch(sql, /create schema if not exists public/);
  }
});

test("the Supabase-only policies and roles are gone", () => {
  // They keyed off auth.jwt() and auth.uid(); this app signs nobody into
  // Supabase Auth, so not one of them ever matched a real request.
  for (const sql of [allCode]) {
    assert.doesNotMatch(sql, /enable row level security/);
    assert.doesNotMatch(sql, /create policy/);
    assert.doesNotMatch(sql, /auth\.(jwt|uid)\(\)/);
    assert.doesNotMatch(sql, /\b(anon|authenticated|service_role)\b/);
  }
});

test("a learner is linked to the platform user with that address", () => {
  assert.match(init, /user_id text unique references public\."User" \(id\) on delete set null/);
});

test("the app role may read only two columns of the platform's users", () => {
  assert.match(grantsCode, /grant select \(id, email\) on public\."User" to klymb_course/);
  // A blanket table grant would expose all 13k+ users' rows.
  assert.doesNotMatch(grantsCode, /grant select on public\."User"/);
  assert.doesNotMatch(grantsCode, /grant [a-z, ]*on all tables in schema public/);
});

test("the app role cannot change the schema it uses", () => {
  assert.doesNotMatch(grantsCode, /grant create on schema course/);
  assert.match(grantsCode, /grant usage on schema course to klymb_course/);
});

test("the rate limiter counts and records atomically", () => {
  // Without the lock, simultaneous requests all count the same number and all pass.
  assert.match(init, /pg_advisory_xact_lock\(/);
  assert.ok(init.indexOf("pg_advisory_xact_lock") < init.indexOf("select count(*) into recent"), "lock must be taken before counting");
  assert.ok(init.indexOf("select count(*) into recent") < init.indexOf("insert into course.rate_limit_events"), "count, then record, inside the lock");
});

test("the audit log refuses edits and deletions", () => {
  assert.match(init, /create trigger admin_audit_log_no_change\s+before update or delete on course\.admin_audit_log/);
  assert.match(init, /raise exception 'admin_audit_log is append-only'/);
});

test("emails are stored canonically, and the constraints are valid from the start", () => {
  // The Supabase original added these NOT VALID because rows already existed.
  for (const table of ["registrations", "learners", "admin_users"]) {
    assert.match(init, new RegExp(`${table}_email_lowercase check \\(email = lower\\(email\\)\\)`));
  }
  assert.doesNotMatch(initCode, /not valid/);
});

test("every table storing a track allows all six", () => {
  for (const table of ["registrations", "learners", "payments"]) {
    const constraint = new RegExp(`${table}_track_check\\s+check \\(track in \\(([^)]*)\\)\\)`);
    const match = init.match(constraint);
    assert.ok(match, `${table} has no track allowlist`);
    assert.equal(match[1].split(",").length, 6, `${table} does not list all six tracks`);
    assert.match(match[1], /'ai-product-manager'/);
  }
});

test("every final attempt is kept, keyed so a double submit records one", () => {
  const final = code(readFileSync(`${dir}/0024_final_attempts.sql`, "utf8"));
  assert.match(final, /create table if not exists course\.final_attempts/);
  assert.match(final, /primary key \(email, course, attempt\)/);
  assert.match(final, /final_attempts_email_lowercase check \(email = lower\(email\)\)/);
  assert.match(final, /primary key \(email, lesson\)/);
});
