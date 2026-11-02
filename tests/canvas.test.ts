import { strict as assert } from "node:assert";
import { test } from "node:test";
import { LESSON_DAYS } from "../src/data/system-design/lessons";
import { gradeBoard, type Board } from "../src/lib/canvas";
import { assessmentParts, flowDone, lessonSteps, defaultState, setLessons, updateLesson, type CourseState } from "../src/lib/course-app";
import { lessonContent } from "../src/lib/sd-lessons";

setLessons(lessonContent(true));
const NOW = new Date(2026, 10, 2, 9).getTime();
const home = (): CourseState => ({ ...defaultState(NOW), screen: "home", onboarded: true });
const day1 = LESSON_DAYS["0-0"].copy.en.canvas!;
const day2 = LESSON_DAYS["0-1"].copy.en.canvas!;

test("a board is graded connection by connection, by kind of part", () => {
  const board: Board = {
    nodes: [{ id: "a", part: "client", x: 0, y: 0 }, { id: "b", part: "server", x: 0, y: 0 }, { id: "b2", part: "server", x: 0, y: 0 }, { id: "c", part: "database", x: 0, y: 0 }],
    edges: [["a", "b"], ["b2", "c"]],
  };
  const r = gradeBoard(day1, board);
  assert.equal(r.score, 2, "any server pointing to the database counts");
  assert.equal(r.of, 2);
  assert.deepEqual(r.extra, []);
});

test("an arrow drawn backwards is called out, and a missing one is missing", () => {
  const board: Board = { nodes: [{ id: "a", part: "client", x: 0, y: 0 }, { id: "b", part: "server", x: 0, y: 0 }, { id: "q", part: "queue", x: 0, y: 0 }], edges: [["b", "a"]] };
  const r = gradeBoard(day1, board);
  assert.deepEqual(r.results.map((x) => x.state), ["reversed", "missing"]);
  assert.equal(r.score, 0);
  assert.deepEqual(r.extra, ["queue"], "a part the model doesn't use is noted, not marked wrong");
});

test("every model connection has its reason, in both languages", () => {
  for (const [id, day] of Object.entries(LESSON_DAYS)) {
    for (const lang of ["en", "hi"] as const) {
      const c = day.copy[lang].canvas;
      if (!c) continue;
      const part = new Map(c.model.nodes.map((n) => [n.id, n.part]));
      for (const [a, b] of c.model.edges) assert.ok(c.why[`${part.get(a)}>${part.get(b)}`], `${id} ${lang} ${a}>${b}`);
      for (const n of c.model.nodes) assert.ok(c.parts.includes(n.part), `${id} offers ${n.part}`);
    }
  }
  assert.equal(gradeBoard(day2, day2.model).score, 3, "the model passes its own check");
});

test("Draw it sits after Build it, counts in the numbering, and is optional", () => {
  const steps = lessonSteps(home(), "0-0", LESSON_DAYS["0-0"]).map((s) => s.key);
  assert.deepEqual(steps.slice(steps.indexOf("build"), steps.indexOf("build") + 2), ["build", "draw"]);
  const parts = assessmentParts("0-1");
  assert.equal(parts.first.draw, parts.first.build + 1);
  assert.equal(parts.first.design, parts.first.draw + 1);
  assert.equal(parts.total, 11, "Day 2: 5 checks, build, draw, design, 3 follow-ups");
  const passed = { watched: true, post: [0, 0, 0, 0, 0] };
  assert.equal(flowDone(updateLesson(home(), "0-0", passed, NOW), "0-0"), true, "the drawing never holds the day back");
});
