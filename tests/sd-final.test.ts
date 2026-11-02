import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { QUESTIONS } from "../src/data/system-design/course-app";
import { FINAL_KEY, gradeAnswer, gradeFinal } from "../src/data/system-design/final";
import { deepLink, defaultState, isLocked, openFinal, openLesson, setLessons, withProgress } from "../src/lib/course-app";
import { lessonContent } from "../src/lib/sd-lessons";
import { paceOf, type SdProgress } from "../src/lib/sd-pace";

const right = [0, [0, 3], 1, [2, 0, 4, 1, 3], "consistency vs availability", 1];

test("every question has a key, and each type grades", () => {
  assert.equal(FINAL_KEY.length, QUESTIONS.length);
  const [mcq, multi, diagram, order, text, timed] = FINAL_KEY;
  assert.equal(gradeAnswer(mcq, 0), 1);
  assert.equal(gradeAnswer(mcq, 1), 0);
  assert.equal(gradeAnswer(multi, [3, 0]), 1);
  assert.equal(gradeAnswer(multi, [0]), 0);
  assert.equal(gradeAnswer(diagram, 1), 1);
  assert.equal(gradeAnswer(order, undefined), 0, "left as shown is wrong");
  assert.equal(gradeAnswer(order, [0, 1, 2, 3, 4]), 0, "the order shown is not the answer");
  assert.equal(gradeAnswer(order, [2, 0, 4, 1, 3]), 1);
  assert.equal(gradeAnswer(text, "Consistency or availability"), 1);
  assert.equal(gradeAnswer(text, "latency"), 0);
  assert.equal(gradeAnswer(timed, 1), 1);
});

test("70% of six questions means five right: four is 67%", () => {
  assert.equal(gradeFinal(right as never).score, 100);
  assert.equal(gradeFinal([0, [0, 3], 1, [2, 0, 4, 1, 3], "", 0]).score, 67);
  assert.equal(gradeFinal([0, [0, 3], 1, [2, 0, 4, 1, 3], "consistency, availability", 0]).score, 83);
  assert.equal(gradeFinal([]).score, 0, "skipping everything scores nothing");
});

test("the correct order of the steps reads right, from the list the browser gets", () => {
  const order = QUESTIONS[3];
  assert.ok(order.type === "order");
  assert.deepEqual([2, 0, 4, 1, 3].map((i) => order.items[i]), ["DNS lookup", "Load balancer", "App server", "Cache (miss)", "Database"]);
});

const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

test("the final's answers never reach a browser", () => {
  assert.ok(!QUESTIONS.some((q) => "ans" in q));
  for (const f of [...walk("src/components"), ...walk("src/lib")].filter((x) => /\.tsx?$/.test(x))) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /system-design\/final"/, f);
  }
});

test("the final's route is the only way to a score, and it records every try", () => {
  const route = readFileSync("src/app/api/sd/final/route.ts", "utf8");
  assert.match(route, /finalOpen/);
  assert.match(route, /on conflict \(email, course, attempt\) do nothing/);
  const check = readFileSync("src/app/api/sd/check/route.ts", "utf8");
  assert.match(check, /canTake\(pace, lesson\)/);
  assert.ok(check.indexOf("canTake(pace, lesson)") < check.indexOf("gradeLesson(lesson, picks)"), "refused before it's graded");
});

const NOW = new Date("2026-11-10T06:00:00Z").getTime();
const progress = (over: Partial<SdProgress> = {}): SdProgress => ({ passes: [], finals: [], refundable: true, ...over });
const app = (p: SdProgress) => { setLessons(lessonContent(true)); return withProgress({ ...defaultState(NOW), onboarded: true, screen: "home" as const }, p); };

test("the second lesson stays shut on the day the first is passed, even from a shared link", () => {
  const s = app(progress({ passes: [{ lesson: "0-0", at: "2026-11-10T05:00:00Z" }] }));
  const opened = openLesson(s, "0-1", NOW);
  assert.equal(opened.screen, "home");
  assert.match(opened.toast ?? "", /Day 2 opens at midnight India time/);
  const linked = deepLink(s, "0-1", NOW);
  assert.notEqual(linked.screen, "player");
});

test("the next morning it opens", () => {
  const s = app(progress({ passes: [{ lesson: "0-0", at: "2026-11-09T05:00:00Z" }] }));
  assert.equal(openLesson(s, "0-1", NOW).screen, "player");
  assert.equal(isLocked(s, "0-1", NOW), false);
});

test("the final is shut until it's open, and a score this browser kept with no try behind it is gone", () => {
  const s = withProgress({ ...app(progress()), post: [1, 1, 1, 1, 1, 1] }, progress());
  assert.equal(s.post, null);
  assert.match(openFinal(s, NOW).toast ?? "", /day after you pass Day 21/);
  assert.equal(paceOf(progress(), NOW).finalOpen, false);
});
