import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { test } from "node:test";
import { BUILT_LESSONS, FREE_LESSONS } from "../src/data/system-design/course-app";
import { LESSON_DAYS } from "../src/data/system-design/lessons";
import {
  afterPayment, deepLink, defaultState, dayOf, hasQuickCheck, isPaywalled, isSoon, openLesson, setLessons, startEnrolled, subtitleLines, type CourseState,
} from "../src/lib/course-app";
import { gradeLesson, isBuiltLesson, isFreeLesson, isFreeVideo, lessonContent, lessonReview, redact } from "../src/lib/sd-lessons";

const NOW = new Date("2026-11-01T12:00:00+05:30").getTime();
const home = (over: Partial<CourseState> = {}): CourseState => ({ ...defaultState(NOW), screen: "home", onboarded: true, ...over });

test("the outline the browser sees lists exactly the lessons that exist", () => {
  assert.deepEqual([...BUILT_LESSONS].sort(), Object.keys(LESSON_DAYS).sort());
  assert.deepEqual(FREE_LESSONS, [], "no lesson is free: the overview video is the free part");
  assert.equal(isFreeLesson("0-0"), false);
  assert.equal(isFreeLesson("0-1"), false);
  assert.equal(isBuiltLesson("0-1"), true);
  assert.equal(isBuiltLesson("3-0"), false);
  assert.equal(isBuiltLesson(7), false);
});

test("without a seat no lesson is sent; with one, every built lesson", () => {
  assert.deepEqual(Object.keys(lessonContent(false)), []);
  assert.deepEqual(Object.keys(lessonContent(true)).sort(), [...BUILT_LESSONS].sort());
});

test("no answer leaves the server inside a lesson", () => {
  for (const [id, { day }] of Object.entries(lessonContent(true))) {
    for (const lang of ["en", "hi"] as const) {
      const c = day.copy[lang];
      assert.equal(c.pre.length, 0, `${id} still sends the retired quiz`);
      assert.ok(c.post.length > 0, `${id} has a check`);
      for (const q of c.post) {
        for (const choice of q.choices) {
          assert.equal("best" in choice, false, `${id} marks the right answer`);
          assert.equal(choice.why, "", `${id} sends an explanation`);
        }
      }
    }
  }
  const original = LESSON_DAYS["0-0"].copy.en.post[0].choices;
  assert.ok(original.some((c) => c.best), "redacting leaves the source alone");
});

test("redaction keeps what the questions need to show", () => {
  const before = LESSON_DAYS["0-1"].copy.en.post[0];
  const after = redact(LESSON_DAYS["0-1"]).copy.en.post[0];
  assert.equal(after.prompt, before.prompt);
  assert.deepEqual(after.choices.map((c) => c.text), before.choices.map((c) => c.text));
});

test("the server grades in both languages alike", () => {
  const best = LESSON_DAYS["0-0"].copy.en.post.map((q) => q.choices.findIndex((c) => c.best));
  assert.deepEqual(gradeLesson("0-0", best), { pct: 100, passed: true });
  assert.deepEqual(gradeLesson("0-0", best.map(() => null)), { pct: 0, passed: false });
  assert.deepEqual(gradeLesson("0-0", []), { pct: 0, passed: false }, "skipping everything fails");
  for (const id of BUILT_LESSONS) {
    const { en, hi } = lessonReview(id);
    assert.deepEqual(en.map((q) => q.choices.findIndex((c) => c.best)), hi.map((q) => q.choices.findIndex((c) => c.best)), id);
  }
});

test("only the overview plays for anyone; every lesson video needs a seat", () => {
  assert.equal(isFreeVideo("overview.mp4"), true);
  assert.equal(isFreeVideo("overview-21day.mp4"), true);
  assert.equal(isFreeVideo("day-0.mp4"), false);
  assert.equal(isFreeVideo("essentials-day-1.mp4"), false);
  assert.equal(isFreeVideo("day-1.mp4"), false);
  assert.equal(isFreeVideo("day-1-wide.mp4"), false);
  assert.equal(isFreeVideo("day-05.mp4"), false);
});

test("paid videos are gone from public/, which anyone can download", () => {
  const files = readdirSync("public/videos/system-design").filter((f) => f.endsWith(".mp4"));
  assert.ok(files.length > 0);
  assert.deepEqual(files.filter((f) => !isFreeVideo(f)), []);
});

/** Everything `entry` really loads: `import type` is erased, so it doesn't count. */
function importsOf(file: string) {
  const source = readFileSync(file, "utf8");
  const found = [...source.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[^"';]*?\sfrom\s+)?"([^"]+)"/gm)].map((m) => m[1]);
  return found.flatMap((spec) => {
    const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : spec.startsWith(".") ? join(dirname(file), spec) : null;
    if (!base) return [];
    return [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), base].filter((p) => existsSync(p) && statSync(p).isFile()).slice(0, 1).map(normalize);
  });
}

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

test("nothing the browser loads can reach a paid lesson", () => {
  const forbidden = /(data\/system-design\/(lessons|final|subtitles-en|day-\d|essentials-day-\d)|lib\/sd-lessons)\.ts$/;
  const roots = [...walk("src/components/course-app"), ...walk("src/components/system-design-offer"), "src/lib/course-app.ts"].filter((f) => /\.tsx?$/.test(f));
  const seen = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const file = queue.pop()!;
    assert.equal(forbidden.test(file), false, `${file} would put paid lessons in the browser bundle`);
    for (const next of importsOf(file)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  assert.ok(seen.size > 30, "the walk followed the imports");
});

test("without a seat a lesson that exists shows the offer, not a lesson", () => {
  setLessons(lessonContent(false));
  assert.equal(isPaywalled("0-0"), true, "Day 1 is paid too");
  assert.equal(isPaywalled("0-1"), true);
  assert.equal(isSoon("0-1"), false, "it is out, not coming soon");
  assert.equal(isPaywalled("3-0"), false, "a lesson that doesn't exist yet stays coming soon");
  assert.equal(dayOf("0-1"), undefined);
  assert.deepEqual(subtitleLines("0-1", "en"), [], "its subtitles stay on the server too");
  assert.equal(hasQuickCheck("0-1"), false, "and so does its quick check");

  const asked = openLesson(home(), "0-1", NOW);
  assert.equal(asked.paywall, true);
  assert.equal(asked.screen, "home");

  const forced = openLesson(home(), "0-1", NOW, true);
  assert.equal(forced.paywall, true, "a shared link doesn't get past it");
});

test("a link to a paid lesson lands on the course with the offer open", () => {
  setLessons(lessonContent(false));
  const s = deepLink({ ...defaultState(NOW) }, "0-1", NOW);
  assert.equal(s.paywall, true);
  assert.equal(s.screen, "course");
  assert.equal(s.onboarded, true);
});

test("starting the course without a seat opens the offer, not a lesson", () => {
  setLessons(lessonContent(false));
  const s = openLesson(home({ cur: "0-0" }), "0-0", NOW);
  assert.equal(s.paywall, true);
  assert.equal(s.screen, "home");
});

test("a seat holder skips the welcome: promises first, once", () => {
  setLessons(lessonContent(true));
  assert.equal(isPaywalled("0-1"), false);
  assert.ok(dayOf("0-1"));
  assert.deepEqual(subtitleLines("0-1", "en"), [], "its captions are burned into the video");
  assert.equal(hasQuickCheck("0-1"), false);

  const fresh = startEnrolled(defaultState(NOW));
  assert.equal(fresh.screen, "commit");
  assert.equal(fresh.onboarded, true);

  const promised = startEnrolled({ ...defaultState(NOW), commitment: { name: "Asha", date: "2026-11-01" } });
  assert.equal(promised.screen, "home");

  const paid = afterPayment(defaultState(NOW), NOW);
  assert.equal(paid.screen, "commit");
  assert.match(paid.toast ?? "", /seat is confirmed/);
});
