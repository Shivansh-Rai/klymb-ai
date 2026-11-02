import { strict as assert } from "node:assert";
import { test } from "node:test";
import { FINAL_MARK, addDays, canTake, istDay, lockedMessage, paceMessage, paceOf, type FinalAttempt, type LessonPass } from "../src/lib/sd-pace";

const lessons = ["a", "b", "c", "d"];
const released: Record<string, string> = { a: "2026-10-31", b: "2026-10-31", c: "2026-10-31", d: "2026-10-31" };
const opts = { lessons, releases: released, from: "2026-11-03" };

/** 18:30 UTC is midnight India time, so noon there is always safely inside the day. */
const noon = (day: string) => `${day}T12:00:00+05:30`;
const pass = (lesson: string, day: string): LessonPass => ({ lesson, at: noon(day) });
const of = (passes: LessonPass[], day: string, finals: FinalAttempt[] = [], o = opts) => paceOf({ passes, finals, refundable: true }, new Date(noon(day)), o);

const run = [pass("a", "2026-11-05"), pass("b", "2026-11-06"), pass("c", "2026-11-07"), pass("d", "2026-11-08")];

test("the day changes at midnight in India, whatever the device's clock says", () => {
  assert.equal(istDay("2026-11-05T18:29:00Z"), "2026-11-05", "11:59pm IST");
  assert.equal(istDay("2026-11-05T18:30:00Z"), "2026-11-06", "midnight IST");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
});

test("Day 1 can start any day, with no deadline", () => {
  const p = of([], "2027-03-14");
  assert.equal(p.state, "start");
  assert.equal(p.dueOn, null);
  assert.equal(p.refund, "on-track");
  assert.ok(canTake(p, "a"));
  assert.ok(!canTake(p, "b"));
});

test("a day passed means tomorrow: the next opens at midnight, not before", () => {
  const p = of(run.slice(0, 1), "2026-11-05");
  assert.equal(p.state, "done");
  assert.ok(!canTake(p, "b"));
  assert.ok(canTake(p, "a"), "a passed lesson stays open to revisit");
  assert.match(lockedMessage(p, "b"), /Day 2 opens at midnight India time/);
  const late = paceOf({ passes: [{ lesson: "a", at: "2026-11-05T18:20:00Z" }], finals: [], refundable: true }, new Date("2026-11-05T18:40:00Z"), opts);
  assert.equal(late.state, "open", "11:50pm to 12:10am is a new day");
});

test("an on-time run keeps the streak and the refund", () => {
  const p = of(run.slice(0, 3), "2026-11-08");
  assert.equal(p.state, "open");
  assert.equal(p.dueOn, "2026-11-08");
  assert.equal(p.streak, 3);
  assert.equal(p.refund, "on-track");
});

test("a whole day missed resets the streak and ends the refund, and learning goes on", () => {
  const p = of(run.slice(0, 2), "2026-11-08");
  assert.equal(p.state, "open");
  assert.ok(canTake(p, "c"), "they can move on");
  assert.equal(p.streak, 0);
  assert.equal(p.missedOn, "2026-11-07");
  assert.equal(p.refund, "lost");
  assert.equal(paceMessage(p).title, "You missed a day.");
});

test("passing late starts a new streak but never brings the refund back", () => {
  const p = of([...run.slice(0, 2), pass("c", "2026-11-09")], "2026-11-10");
  assert.equal(p.streak, 1);
  assert.equal(p.longest, 2);
  assert.equal(p.missedOn, "2026-11-07");
  assert.equal(p.refund, "lost");
});

test("failing and passing after midnight is still a miss", () => {
  assert.equal(of([...run.slice(0, 2), pass("c", "2026-11-08")], "2026-11-08").refund, "lost");
});

test("still one a day after a miss", () => {
  const p = of([...run.slice(0, 2), pass("c", "2026-11-09")], "2026-11-09");
  assert.equal(p.state, "done");
  assert.ok(!canTake(p, "d"));
});

const dripping = { lessons, releases: { a: "2026-11-05", b: "2026-11-20" }, from: "2026-11-03" };

test("waiting for a lesson that isn't out never counts as a miss", () => {
  const p = of([pass("a", "2026-11-05")], "2026-11-15", [], dripping);
  assert.equal(p.state, "waiting");
  assert.equal(p.refund, "on-track");
  assert.equal(p.streak, 1);
  assert.ok(!canTake(p, "b"));
  assert.match(paceMessage(p).body, /safe/);
});

test("a new lesson can be passed on the day it comes out or the next, not later", () => {
  const a = [pass("a", "2026-11-05")];
  assert.equal(of([...a, pass("b", "2026-11-20")], "2026-11-21", [], dripping).refund, "on-track");
  assert.equal(of([...a, pass("b", "2026-11-21")], "2026-11-21", [], dripping).refund, "on-track");
  assert.equal(of([...a, pass("b", "2026-11-22")], "2026-11-22", [], dripping).refund, "lost");
  assert.equal(of(a, "2026-11-21", [], dripping).refund, "on-track", "not passed yet, last day");
  assert.equal(of(a, "2026-11-22", [], dripping).refund, "lost");
});

test("gaps before these rules began can't count as misses", () => {
  const old = [pass("a", "2026-10-31"), pass("b", "2026-10-31")];
  assert.equal(of(old, "2026-11-04").refund, "on-track", "due the day after the rules begin");
  assert.equal(of(old, "2026-11-05").refund, "lost", "and held to them from then on");
  assert.equal(of([pass("a", "2026-10-31"), pass("b", "2026-11-03")], "2026-11-04").refund, "on-track");
});

const attempt = (n: number, score: number, day: string): FinalAttempt => ({ attempt: n, score, at: noon(day) });

test("the final opens the day after the last lesson, and is due that day", () => {
  const before = of(run, "2026-11-08");
  assert.equal(before.state, "done");
  assert.equal(before.finalOpen, false);
  assert.match(paceMessage(before).body, /final assessment opens at midnight/);
  const p = of(run, "2026-11-09");
  assert.equal(p.state, "final");
  assert.equal(p.finalOpen, true);
  assert.equal(p.finalsLeft, 3);
  assert.equal(p.dueOn, "2026-11-09");
  assert.equal(of(run, "2026-11-10").refund, "lost", "not taken on the day");
});

test(`${FINAL_MARK}% on the due day earns the refund, and 69% doesn't`, () => {
  assert.equal(of(run, "2026-11-09", [attempt(1, 70, "2026-11-09")]).refund, "earned");
  assert.equal(of(run, "2026-11-09", [attempt(1, 70, "2026-11-09")]).state, "finished");
  const low = of(run, "2026-11-09", [attempt(1, 69, "2026-11-09")]);
  assert.equal(low.refund, "on-track");
  assert.equal(low.finalsLeft, 2);
});

test("the best of three tries counts", () => {
  const tries = [attempt(1, 50, "2026-11-09"), attempt(2, 83, "2026-11-09"), attempt(3, 33, "2026-11-09")];
  assert.equal(of(run, "2026-11-09", tries).refund, "earned");
  assert.equal(of(run, "2026-11-09", tries).finalBest, 83);
});

test("three misses end the refund, and a pass on the fourth try is practice", () => {
  const tries = [attempt(1, 50, "2026-11-09"), attempt(2, 50, "2026-11-09"), attempt(3, 50, "2026-11-09")];
  const out = of(run, "2026-11-09", tries);
  assert.equal(out.refund, "lost");
  assert.equal(out.finalsLeft, 0);
  assert.equal(out.state, "final", "they can still retake it");
  assert.match(paceMessage(out).body, /3 tries/);
  assert.equal(of(run, "2026-11-09", [...tries, attempt(4, 100, "2026-11-09")]).refund, "lost");
});

test("a late final doesn't count, even at 100%", () => {
  assert.equal(of(run, "2026-11-10", [attempt(1, 100, "2026-11-10")]).refund, "lost");
});

test("the refund can't be earned after a missed day, however the final goes", () => {
  const late = [...run.slice(0, 3), pass("d", "2026-11-10")];
  assert.equal(of(late, "2026-11-11", [attempt(1, 100, "2026-11-11")]).refund, "lost");
});

test("a seat with no fee to return hears nothing about a refund", () => {
  const p = paceOf({ passes: run.slice(0, 1), finals: [], refundable: false }, new Date(noon("2026-11-06")), opts);
  assert.doesNotMatch(paceMessage(p).body, /refund/);
});

test("a lesson passed out of order stays open, and the first gap is what's next", () => {
  const p = of([pass("b", "2026-11-05")], "2026-11-06");
  assert.equal(p.lesson, "a");
  assert.ok(canTake(p, "b"));
});
