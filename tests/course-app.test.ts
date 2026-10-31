import { strict as assert } from "node:assert";
import { test } from "node:test";
import { QUESTIONS } from "../src/data/system-design/course-app";
import { LESSON_DAYS } from "../src/data/system-design/lessons";
import { lessonContent } from "../src/lib/sd-lessons";
import {
  ALL_IDS, addNote, closeQuiz, completeNext, deepLink, defaultState, flowDone, fmt, fromStored, grade, isAnswered, isSoon, lessonSteps, localDate,
  migrateLegacy, miniActive, nextQuestion, openLesson, pickOption, previewState, setAnswer, stageFor, streak, tick, toStored, togglePlay,
  setLessons, updateLesson, type CourseState,
} from "../src/lib/course-app";

// The app gets its lessons from the server; these tests take the full set, as a seat holder does.
setLessons(lessonContent(true));

const NOW = new Date(2026, 9, 21, 9, 0, 0).getTime();
const home = (): CourseState => ({ ...defaultState(NOW), screen: "home", onboarded: true });
/** Day 1 with every practice step done. */
const day0Done = (s: CourseState) => updateLesson(s, "0-0", { watched: true, built: 0, post: [0, 0, 0, 0, 0], follow: [true, true, false] }, NOW);

test("fmt shows m:ss and never goes negative", () => {
  assert.equal(fmt(0), "0:00");
  assert.equal(fmt(754.9), "12:34");
  assert.equal(fmt(65), "1:05");
  assert.equal(fmt(-5), "0:00");
});

test("grading each question type", () => {
  const [mcq, multi, diagram, order, text, timed] = QUESTIONS;
  assert.equal(grade(mcq, 0), 1);
  assert.equal(grade(mcq, 1), 0);
  assert.equal(grade(multi, [3, 0]), 1);
  assert.equal(grade(multi, [0]), 0);
  assert.equal(grade(diagram, 1), 1);
  assert.equal(grade(order, undefined), 0, "the shuffled starting order is wrong");
  assert.equal(grade(order, [0, 1, 2, 3, 4]), 1);
  assert.equal(grade(text, "Consistency or availability"), 1);
  assert.equal(grade(text, "latency"), 0);
  assert.equal(grade(timed, 1), 1);
});

test("Next needs an answer, except for ordering", () => {
  const [mcq, multi, , order, text] = QUESTIONS;
  assert.equal(isAnswered(mcq, undefined), false);
  assert.equal(isAnswered(multi, []), false);
  assert.equal(isAnswered(order, undefined), true);
  assert.equal(isAnswered(text, "ok"), false);
  assert.equal(isAnswered(text, "both"), true);
});

test("multi-select toggles options on and off", () => {
  let s = previewState("q", { q: 1 }, NOW);
  s = pickOption(s, 2);
  assert.deepEqual(s.quiz.answers[1], [0, 2]);
  s = pickOption(s, 0);
  assert.deepEqual(s.quiz.answers[1], [2]);
});

test("finishing the final assessment grades it and opens its results", () => {
  let s: CourseState = { ...home(), screen: "quiz", quiz: { kind: "post", stage: "q", idx: 0, answers: {} } };
  const right: Record<number, Parameters<typeof setAnswer>[1]> = { 0: 0, 1: [0, 3], 2: 1, 3: [0, 1, 2, 3, 4], 4: "consistency vs availability", 5: 1 };
  for (let i = 0; i < QUESTIONS.length; i++) s = nextQuestion(setAnswer(s, right[i]));
  assert.equal(s.screen, "results");
  assert.equal(s.lastKind, "post");
  assert.deepEqual(s.post, [1, 1, 1, 1, 1, 1]);
});

test("the timed question moves on by itself when time runs out", () => {
  let s: CourseState = { ...home(), screen: "quiz", quiz: { kind: "post", stage: "q", idx: 5, answers: {} }, timeLeft: 1 };
  s = tick(s, NOW);
  assert.equal(s.screen, "results");
});

test("closing a started assessment asks first", () => {
  const started: CourseState = { ...home(), screen: "quiz", quiz: { kind: "post", stage: "q", idx: 1, answers: { 0: 0 } } };
  assert.equal(closeQuiz(started).confirmExit, true);
  const unstarted: CourseState = { ...started, quiz: { ...started.quiz, answers: {} } };
  assert.equal(closeQuiz(unstarted).screen, "home");
});

test("the video moves the playhead; tick only counts today's minutes", () => {
  const s = tick({ ...home(), screen: "player", visited: true, playing: true, t: 10 }, NOW);
  assert.equal(s.t, 10);
  assert.equal(s.todaySec, 1);
  assert.equal(s.qcOpen, false, "no lesson has a quick check yet");
});

test("leaving a lesson there's no mini player yet", () => {
  assert.equal(miniActive({ ...home(), visited: true, playing: true }), false);
});

test("offline, the lesson won't play", () => {
  const s: CourseState = { ...home(), screen: "player", cur: "0-0", offline: true };
  assert.equal(togglePlay(s).playing, false);
  assert.equal(togglePlay({ ...s, offline: false }).playing, true);
});

test("a lesson can't be completed until its practice is done", () => {
  const s: CourseState = { ...home(), screen: "player", cur: "0-0" };
  assert.equal(flowDone(s, "0-0"), false);
  const blocked = completeNext(s, false, NOW);
  assert.deepEqual(blocked.done, []);
  assert.match(blocked.toast ?? "", /practice/);
});

test("finishing Day 1 marks it done and opens Day 2", () => {
  const s = completeNext(day0Done({ ...home(), screen: "player", cur: "0-0" }), false, NOW);
  assert.equal(s.screen, "player");
  assert.equal(s.cur, "0-1");
  assert.deepEqual(s.done, ["0-0"]);
});

test("a lesson opens on the step it still has to do, and the next one on its video", () => {
  const fresh = openLesson(home(), "0-0", NOW);
  assert.equal(fresh.stage, "watch", "nothing done yet");

  const watched = openLesson(updateLesson(home(), "0-0", { watched: true }, NOW), "0-0", NOW);
  assert.equal(watched.stage, "prove", "the video is done, so the assessment is next");

  const read = openLesson(updateLesson(home(), "0-0", { watched: true, read: true }, NOW), "0-0", NOW);
  assert.equal(read.stage, "prove", "learn is read, the assessment still stands");

  const passed = openLesson(updateLesson(home(), "0-0", { watched: true, post: [0, 0, 0, 0, 0] }, NOW), "0-0", NOW);
  assert.equal(passed.stage, "build", "past the assessment, on to the practice");

  const on = completeNext(day0Done({ ...home(), screen: "player", cur: "0-0", stage: "done" }), false, NOW);
  assert.equal(on.stage, "watch", "Day 2 starts on its own video, not Day 1's last step");
  assert.equal(on.checkBusy, false);
});

test("the step bar never opens a step the lesson hasn't reached", () => {
  const s = updateLesson(home(), "0-0", { watched: true }, NOW);
  const steps = lessonSteps(s, "0-0", LESSON_DAYS["0-0"]);
  assert.deepEqual(steps.filter((x) => x.open).map((x) => x.key), ["watch", "reveal", "prove"]);
  assert.equal(stageFor(s, "0-0"), "prove");
});

/** Every step of a built lesson done, whatever steps that lesson has. */
function fullProgress(id: string) {
  const c = LESSON_DAYS[id].copy.en;
  return {
    watched: true, post: c.post.map(() => 0),
    ...(c.estimates?.length ? { est: c.estimates.map((e) => e.answer) } : {}),
    ...(c.build ? { built: 0 } : {}),
    ...(c.design ? { design: "A full attempt at the design problem." } : {}),
    ...(c.followUps?.length ? { follow: c.followUps.map(() => true) } : {}),
  };
}
const LAST_BUILT = ALL_IDS.filter((id) => !isSoon(id)).at(-1)!;
const FIRST_SOON = ALL_IDS.find((id) => isSoon(id))!;

test("finishing a lesson whose next day isn't out yet goes home", () => {
  const s0 = updateLesson({ ...home(), screen: "player", cur: LAST_BUILT }, LAST_BUILT, fullProgress(LAST_BUILT), NOW);
  const s = completeNext(s0, false, NOW);
  assert.ok(s.done.includes(LAST_BUILT));
  assert.equal(s.screen, "home");
  assert.match(s.toast ?? "", /coming soon/);
});

test("every built day can be finished from start to end", () => {
  for (const id of Object.keys(LESSON_DAYS)) {
    assert.equal(flowDone(updateLesson(home(), id, fullProgress(id), NOW), id), true, id);
  }
});

test("coming-soon lessons don't open", () => {
  assert.equal(isSoon(FIRST_SOON), true);
  const s = openLesson(home(), FIRST_SOON, NOW);
  assert.equal(s.screen, "home");
  assert.match(s.toast ?? "", /coming soon/);
});

test("the last lesson of the course stays put", () => {
  const last = ALL_IDS[ALL_IDS.length - 1];
  const s = completeNext({ ...home(), screen: "player", cur: last, done: ALL_IDS.slice(0, -1) }, false, NOW);
  assert.equal(s.screen, "recap");
  assert.equal(s.cur, last);
});

test("notes are pinned to the current lesson and moment", () => {
  const s = addNote({ ...home(), cur: "0-1", t: 42, draft: "  pre-scale before midnight  " }, NOW);
  assert.deepEqual(s.notes["0-1"], [{ t: 42, text: "pre-scale before midnight" }]);
  assert.equal(s.draft, "");
});

test("a first visit has no sample learner, but the inbox opens with the sample notifications", () => {
  const s = defaultState(NOW);
  assert.deepEqual(s.done, []);
  assert.deepEqual(s.pre, []);
  assert.equal(s.notifs.length, 5);
  assert.equal(s.notifs.filter((n) => n.unread).length, 2);
  assert.equal(s.cur, "0-0");
  assert.equal(streak(s, NOW).current, 0);
});

test("a finished step counts today; the streak runs back through consecutive days", () => {
  const s = updateLesson(home(), "0-0", { watched: true }, NOW);
  assert.deepEqual(s.activeDays, [localDate(new Date(NOW))]);
  const day = (n: number) => localDate(new Date(NOW - n * 86_400_000));
  assert.deepEqual(streak({ ...s, activeDays: [day(0), day(1), day(2), day(5)] }, NOW), { current: 3, longest: 3, today: true });
  assert.equal(streak({ ...s, activeDays: [day(1), day(2)] }, NOW).current, 2, "today not done yet keeps yesterday's run");
  assert.equal(streak({ ...s, activeDays: [day(2)] }, NOW).current, 0);
});

test("?lesson= opens straight into a lesson; unknown or coming-soon ids are ignored", () => {
  const s = deepLink(defaultState(NOW), "0-1", NOW);
  assert.equal(s.screen, "player");
  assert.equal(s.cur, "0-1");
  assert.equal(s.onboarded, true);
  assert.equal(deepLink(defaultState(NOW), FIRST_SOON, NOW).screen, "splash");
  assert.equal(deepLink(defaultState(NOW), "9-9", NOW).screen, "splash");
});

test("progress from the old Day pages carries over once", () => {
  const s = migrateLegacy(defaultState(NOW), { day0: { pre: [0, 1, 0], watched: true }, day1: null, lang: "hi" }, NOW);
  assert.deepEqual(s.lessons["0-0"], { watched: true }, "the retired opening quiz is dropped");
  assert.equal(s.lessons["0-1"], undefined);
  assert.equal(s.lang, "hi");
  const again = migrateLegacy(s, { day0: { watched: false, post: [0, 0, 0, 0, 0] } }, NOW);
  assert.deepEqual(again.lessons["0-0"], { watched: true }, "existing progress wins");
});

test("saved progress round-trips, and today's minutes reset on a new day", () => {
  const s = { ...day0Done(home()), done: ["0-0"], todaySec: 600, lang: "hi" as const };
  const raw = JSON.parse(JSON.stringify(toStored(s)));
  const same = fromStored(raw, NOW);
  assert.deepEqual(same.done, ["0-0"]);
  assert.equal(same.lang, "hi");
  assert.equal(flowDone(same, "0-0"), true, "lesson practice is saved");
  assert.equal(same.todaySec, 600);
  assert.equal(same.screen, "home");
  const tomorrow = fromStored(raw, NOW + 86_400_000);
  assert.equal(tomorrow.todaySec, 0);
  assert.equal(tomorrow.today, localDate(new Date(NOW + 86_400_000)));
});

test("progress saved by an older version, with downloads in it, still loads", () => {
  const raw = { ...JSON.parse(JSON.stringify(toStored(home()))), dl: [{ id: "0-0", size: 38 }], dlProg: { "0-1": 40 }, onboarded: true };
  const s = fromStored(raw, NOW);
  assert.equal(s.screen, "home");
  assert.equal("dl" in s, false, "downloads are no longer part of the state");
  assert.equal("dl" in toStored(s), false);
});

test("a first visit starts on the splash screen", () => {
  assert.equal(fromStored(null, NOW).screen, "splash");
  assert.equal(fromStored({ onboarded: false }, NOW).screen, "splash");
});

test("a day with estimates and a design attempt isn't finished until both are done", () => {
  const base = { pre: [0, 0, 0], watched: true, post: [0, 0, 0, 0], built: 1, follow: [true, true, true, true] };
  const noEst = updateLesson(home(), "0-1", base, NOW);
  assert.equal(flowDone(noEst, "0-1"), false, "estimates still to do");
  const noDesign = updateLesson(home(), "0-1", { ...base, est: [267, 30000, 267] }, NOW);
  assert.equal(flowDone(noDesign, "0-1"), false, "design attempt still to write");
  const all = updateLesson(noDesign, "0-1", { design: "Waiting room and one atomic stock counter." }, NOW);
  assert.equal(flowDone(all, "0-1"), true);
});

test("course activity events are cut down to known names and short, flat values", async () => {
  const { cleanEvent, validAnon } = await import("../src/lib/sd-events");
  assert.equal(cleanEvent({ e: "drop_table" }), null);
  const e = cleanEvent({ e: "step_done", lesson: "0-0", step: "pre", props: { score: 2, qs: "a,b", "bad key": 1, nested: { x: 1 }, long: "x".repeat(500) } });
  assert.deepEqual(Object.keys(e!.props).sort(), ["long", "qs", "score"]);
  assert.equal((e!.props.long as string).length, 300);
  assert.equal(validAnon("abc"), false);
  assert.equal(validAnon("3f2a9c1e-77aa-4c1d-9a1b-0c2d3e4f5a6b"), true);
});

test("the admin summary counts each learner once per step and finds where they stopped", async () => {
  const { summarise } = await import("../src/lib/sd-summary");
    const ev = (anon: string, event: string, step: string | null, props: Record<string, unknown> = {}, lesson = "0-0") =>
    ({ created_at: new Date(NOW).toISOString(), anon_id: anon, email: null, event, lesson, step, props, lang: "en", device: "phone" });
  const best = LESSON_DAYS["0-0"].copy.en.pre.map((q) => q.choices.findIndex((c) => c.best));
  const events = [
    ev("aaaaaaaa", "lesson_open", null), ev("aaaaaaaa", "lesson_open", null), ev("aaaaaaaa", "step_done", "started"),
    ev("aaaaaaaa", "step_done", "pre", { qs: LESSON_DAYS["0-0"].copy.en.pre.map((q) => q.id).join(","), picks: best.join(",") }),
    ev("aaaaaaaa", "ping", "watch"), ev("aaaaaaaa", "ping", "watch"),
    ev("bbbbbbbb", "lesson_open", null), ev("bbbbbbbb", "ping", "call"), ev("bbbbbbbb", "day_complete", null),
  ];
  const sum = summarise(events, [], LESSON_DAYS);
  const day0 = sum.lessons.find((l) => l.id === "0-0")!;
  assert.equal(day0.funnel[0].value, 2, "two people opened Day 0");
  assert.equal(day0.funnel[1].value, 1, "one pressed Start");
  assert.deepEqual(day0.stoppedAt, [{ label: "Watch", value: 1 }], "the finisher isn't counted as stuck");
  assert.equal(day0.answers[0].right, 1);
  assert.equal(sum.totals.visitors, 2);
  assert.equal(sum.totals.completedAny, 1);
});
