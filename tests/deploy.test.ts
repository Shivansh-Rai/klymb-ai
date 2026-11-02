import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/** Only the paths that stop before building: the rest runs `next build`. */
const run = (env: Record<string, string>) => spawnSync("sh", ["scripts/vercel-build.sh"], { env: { ...process.env, VERCEL_ENV: undefined, DATABASE_MIGRATE_URL: undefined, ...env }, encoding: "utf8" });

test("Vercel builds through the script that migrates", () => {
  assert.equal(JSON.parse(readFileSync("package.json", "utf8")).scripts["vercel-build"], "sh scripts/vercel-build.sh");
});

test("a production deploy without the owner login stops, and says what to set", () => {
  const out = run({ VERCEL_ENV: "production" });
  assert.equal(out.status, 1);
  assert.match(out.stderr, /DATABASE_MIGRATE_URL/);
});

test("an unknown environment stops rather than skip the migration", () => {
  assert.equal(run({}).status, 1);
  assert.equal(run({ VERCEL_ENV: "staging" }).status, 1);
});

test("the script stops at the first failure, so a failed migration can't build", () => {
  const script = readFileSync("scripts/vercel-build.sh", "utf8");
  assert.match(script, /^set -e$/m);
  assert.ok(script.indexOf("npm run db:migrate") < script.indexOf("exec next build"));
});
