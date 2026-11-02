/**
 * Applies db/migrations/*.sql in order, once each.
 *
 *   npm run db:migrate
 *
 * Connects with DATABASE_MIGRATE_URL when it is set, falling back to
 * DATABASE_URL. Those are normally two different roles: migrations need to
 * create tables, while the running app connects as klymb_course, which may
 * only read and write them — see db/migrations/0002_grants.sql.
 *
 * Each file runs inside one transaction together with the ledger row that
 * records it, so a file that fails leaves nothing behind and can be fixed and
 * re-run. Files are sent whole, in one statement, so that dollar-quoted
 * function bodies are parsed by the server rather than split up here.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { connectionOptions } from "../src/lib/db/connection";

// .env.local and friends, read the way next dev reads them.
loadEnvConfig(process.cwd());

const DIR = path.join(process.cwd(), "db", "migrations");

/**
 * Splits a file into individual statements.
 *
 * Only needed for no-transaction migrations: node-postgres sends a
 * multi-statement string as one simple query, and Postgres wraps that in an
 * implicit transaction block — which CREATE INDEX CONCURRENTLY refuses to run
 * in, explicit BEGIN or not. So those files go over one statement at a time.
 *
 * Dollar-quoted bodies are the reason this can't be `sql.split(";")`: a
 * function body is full of semicolons that are not statement boundaries.
 */
function statements(sql: string): string[] {
  const out: string[] = [];
  let start = 0;
  let i = 0;
  while (i < sql.length) {
    const rest = sql.slice(i);
    if (sql.startsWith("--", i)) {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl + 1;
      continue;
    }
    if (sql.startsWith("/*", i)) {
      const close = sql.indexOf("*/", i + 2);
      i = close === -1 ? sql.length : close + 2;
      continue;
    }
    if (sql[i] === "'") {
      i += 1;
      while (i < sql.length && sql[i] !== "'") i += 1;
      i += 1;
      continue;
    }
    const dollar = /^\$[A-Za-z_]*\$/.exec(rest);
    if (dollar) {
      const tag = dollar[0];
      const close = sql.indexOf(tag, i + tag.length);
      i = close === -1 ? sql.length : close + tag.length;
      continue;
    }
    if (sql[i] === ";") {
      const stmt = sql.slice(start, i).trim();
      if (stmt) out.push(stmt);
      start = i + 1;
    }
    i += 1;
  }
  const tail = sql.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

/** Held for the whole run, so two deploys at once take turns instead of racing for the same file. Any fixed number will do. */
const MIGRATION_LOCK = 7_204_511;

/** Who and where, from a connection string, with the password left out. */
function announce(url: string) {
  try {
    const { username, hostname, pathname } = new URL(url);
    const endpoint = hostname.split(".")[0].replace(/-pooler$/, "");
    console.log(`→ ${pathname.replace("/", "")} on ${endpoint} as ${username}\n`);
  } catch {
    console.log("→ connecting (connection string is not a parseable URL)\n");
  }
}

async function main() {
  const url = process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_MIGRATE_URL (or DATABASE_URL) first.");
    process.exit(1);
  }

  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.error(`No .sql files in ${DIR}`);
    process.exit(1);
  }

  // Say out loud which database this is about to change. There are four
  // connection strings in play — branch and production, each with an owner and
  // an application role — and the only thing distinguishing them is a hostname
  // nobody reads carefully. Never print the password.
  announce(url);

  const client = new Client(connectionOptions(url));
  await client.connect();

  try {
    // Asked again and again, never waited on: CREATE INDEX CONCURRENTLY waits for
    // open transactions, and a blocked pg_advisory_lock is one, so the two deadlock.
    let waiting = false;
    while (!(await client.query<{ ok: boolean }>("select pg_try_advisory_lock($1) as ok", [MIGRATION_LOCK])).rows[0].ok) {
      if (!waiting) console.log("Another run is migrating. Waiting for it.");
      waiting = true;
      await new Promise((r) => setTimeout(r, 1000));
    }

    // The ledger has to exist before the first migration can be recorded, and
    // 0001 is what creates the schema it lives in.
    await client.query("create schema if not exists course");
    await client.query(`
      create table if not exists course.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows } = await client.query<{ name: string; checksum: string }>(
      "select name, checksum from course.schema_migrations",
    );
    const applied = new Map(rows.map((r) => [r.name, r.checksum]));

    let count = 0;
    for (const name of files) {
      const sql = readFileSync(path.join(DIR, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex").slice(0, 16);
      const seen = applied.get(name);

      if (seen) {
        // An applied migration that has since been edited is a problem the
        // next environment will hit as a schema difference, so say so rather
        // than skipping in silence.
        if (seen !== checksum) console.warn(`! ${name} changed since it was applied (${seen} → ${checksum})`);
        continue;
      }

      // CREATE INDEX CONCURRENTLY and a few other statements cannot run inside
      // a transaction block. A file says so with `-- migrate: no-transaction`
      // on any line, and is then responsible for being safe to re-run, since a
      // failure part-way leaves what it already did in place.
      const standalone = /^--\s*migrate:\s*no-transaction\s*$/m.test(sql);

      if (standalone) {
        const parts = statements(sql);
        try {
          for (const stmt of parts) await client.query(stmt);
          await client.query("insert into course.schema_migrations (name, checksum) values ($1, $2)", [name, checksum]);
          console.log(`✓ ${name} (${parts.length} statements, outside a transaction)`);
          count += 1;
        } catch (e) {
          throw new Error(`${name} failed: ${e instanceof Error ? e.message : String(e)}`);
        }
        continue;
      }

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into course.schema_migrations (name, checksum) values ($1, $2)", [name, checksum]);
        await client.query("commit");
        console.log(`✓ ${name}`);
        count += 1;
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${name} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(count === 0 ? "Already up to date." : `Applied ${count} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
