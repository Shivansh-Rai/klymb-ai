import { strict as assert } from "node:assert";
import { test } from "node:test";
import { COURSE_LESSONS, SD_FINAL_ASSESSMENT, emailFromToken, pickSdReminder, sdLessonCounts, unsubscribeToken, type ReminderLearner } from "../src/lib/sd-reminders";

const BUILT = ["0-0", "1-0", "1-1"];
const ALL = COURSE_LESSONS.map((l) => l.id);
const learner = (over: Partial<ReminderLearner> = {}): ReminderLearner => ({ enrolledOn: "2026-11-01", passes: new Map(), remindedOn: null, streak: 0, ...over });

test("course lessons run in order with stable ids", () => {
  assert.equal(COURSE_LESSONS[0].id, "0-0");
  assert.equal(COURSE_LESSONS[1].id, "0-1");
  assert.ok(COURSE_LESSONS.every((l, i) => l.position === i && l.minutes >= 10));
  assert.deepEqual(sdLessonCounts(BUILT), { out: 3, total: COURSE_LESSONS.length });
});

test("not on the day they enrolled", () => {
  assert.equal(pickSdReminder(learner(), "2026-11-01", BUILT), null);
});

test("the next lesson out that isn't passed", () => {
  const pick = pickSdReminder(learner({ passes: new Map([["0-0", "2026-11-01"]]) }), "2026-11-02", BUILT);
  assert.equal(pick?.target.kind, "lesson");
  assert.equal(pick?.target.kind === "lesson" && pick.target.lesson.id, "1-0");
  assert.equal(pick?.behind, 2);
  assert.equal(pick?.streak, 1);
});

test("nothing when a lesson was passed today", () => {
  assert.equal(pickSdReminder(learner({ passes: new Map([["0-0", "2026-11-05"]]) }), "2026-11-05", BUILT), null);
});

test("nothing twice in one day", () => {
  assert.equal(pickSdReminder(learner({ remindedOn: "2026-11-05", streak: 1 }), "2026-11-05", BUILT), null);
});

test("caught up on everything out: left alone, then due the day a lesson ships", () => {
  const passes = new Map(BUILT.map((id) => [id, "2026-11-02"]));
  assert.equal(pickSdReminder(learner({ passes }), "2026-11-04", BUILT), null);
  const shipped = pickSdReminder(learner({ passes }), "2026-11-04", [...BUILT, "1-2"]);
  assert.equal(shipped?.target.kind === "lesson" && shipped.target.lesson.id, "1-2");
});

test("every lesson passed: the final assessment, until it is passed", () => {
  const passes = new Map(ALL.map((id) => [id, "2026-12-01"]));
  assert.equal(pickSdReminder(learner({ passes }), "2026-12-03", ALL)?.target.kind, "assessment");
  passes.set(SD_FINAL_ASSESSMENT, "2026-12-02");
  assert.equal(pickSdReminder(learner({ passes }), "2026-12-03", ALL), null);
});

test("cadence: daily for three, then every third day, then weekly", () => {
  const at = (streak: number, remindedOn: string, today: string) => pickSdReminder(learner({ streak, remindedOn }), today, BUILT);
  assert.ok(at(2, "2026-11-05", "2026-11-06"), "third in a row is still daily");
  assert.equal(at(3, "2026-11-05", "2026-11-07"), null, "fourth waits three days");
  assert.ok(at(3, "2026-11-05", "2026-11-08"));
  assert.equal(at(10, "2026-11-05", "2026-11-11"), null, "from the tenth, weekly");
  assert.ok(at(10, "2026-11-05", "2026-11-12"));
});

test("a pass since the last reminder starts the count again", () => {
  const pick = pickSdReminder(learner({ streak: 9, remindedOn: "2026-11-05", passes: new Map([["0-0", "2026-11-06"]]) }), "2026-11-07", BUILT);
  assert.equal(pick?.streak, 1);
});

test("unsubscribe tokens round-trip and can't be altered", () => {
  const secret = "x".repeat(32);
  const t = unsubscribeToken("learner@gmail.com", secret);
  assert.equal(emailFromToken(t, secret), "learner@gmail.com");
  assert.equal(emailFromToken(t, "y".repeat(32)), null, "another secret");
  const forged = `${Buffer.from("other@gmail.com").toString("base64url")}.${t.split(".")[1]}`;
  assert.equal(emailFromToken(forged, secret), null, "another address");
  assert.equal(emailFromToken("nope", secret), null);
  assert.equal(emailFromToken(t, undefined), null);
});
