import { strict as assert } from "node:assert";
import { test } from "node:test";
import { TRANSCRIPTS } from "../src/data/system-design/lessons";
import { lessonContent } from "../src/lib/sd-lessons";
import { SUBTITLES_EN } from "../src/data/system-design/subtitles-en";
import {
  SPEED_MAX, SPEED_MIN, audioTrack, audioTracks, defaultState, fromStored, lineAt, setSpeed, speedLabel, stepSpeed, subtitleLangs,
  setLessons, toStored, type CourseState,
} from "../src/lib/course-app";

// The app gets its lessons from the server; these tests take the full set, as a seat holder does.
setLessons(lessonContent(true));

const NOW = new Date(2026, 9, 21, 9, 0, 0).getTime();
const base = (): CourseState => ({ ...defaultState(NOW), screen: "player", onboarded: true });

test("speed is clamped to the allowed range in 0.05 steps", () => {
  assert.equal(setSpeed(base(), 1.3333).speed, 1.35);
  assert.equal(setSpeed(base(), 9).speed, SPEED_MAX);
  assert.equal(setSpeed(base(), 0.1).speed, SPEED_MIN);
  const s = base();
  assert.equal(setSpeed(s, 1), s, "no change keeps the same state");
});

test("< and > move to the next preset, from between presets too", () => {
  assert.equal(stepSpeed(base(), 1).speed, 1.25);
  assert.equal(stepSpeed(base(), -1).speed, 0.75);
  const between = setSpeed(base(), 1.1);
  assert.equal(stepSpeed(between, 1).speed, 1.25);
  assert.equal(stepSpeed(between, -1).speed, 1);
  assert.equal(stepSpeed(setSpeed(base(), 2), 1).speed, 2, "fine control goes past 2×, the presets stop there");
  assert.equal(stepSpeed(setSpeed(base(), 0.5), -1).speed, 0.5);
});

test("speed labels drop float noise", () => {
  assert.equal(speedLabel(1), "1×");
  assert.equal(speedLabel(1.25), "1.25×");
  assert.equal(speedLabel(0.8000000001), "0.8×");
});

test("English subtitles line up with the Hinglish captions, line for line", () => {
  for (const [id, en] of Object.entries(SUBTITLES_EN)) {
    const hi = TRANSCRIPTS[id];
    assert.ok(hi, `${id} has Hinglish captions`);
    assert.deepEqual(en.map(([t]) => t), hi.map(([t]) => t), `${id} timings`);
    for (const [, text] of en) assert.ok(text.trim().length > 0);
  }
});

test("subtitle languages per lesson, and the line at a moment", () => {
  assert.deepEqual(subtitleLangs("0-0"), [], "the Essentials videos have their captions burned in");
  assert.deepEqual(subtitleLangs("2-2"), []);
  const en = SUBTITLES_EN["legacy-0-0"];
  assert.equal(lineAt(en, 0), en[0][1]);
  assert.equal(lineAt(en, 5), en[1][1]);
  assert.equal(lineAt([[3, "late"]], 1), "");
});

test("an audio language a lesson lacks falls back to the original voice-over", () => {
  const tracks = audioTracks("0-0");
  assert.equal(tracks[0].lang, "Hinglish");
  assert.equal(tracks.length, 1, "one voice-over");
  assert.equal(audioTrack({ ...base(), audio: "English" }, "0-0").lang, "Hinglish");
});

test("player settings are saved with progress", () => {
  const s = { ...setSpeed(base(), 1.35), subLang: "en" as const, subSize: "l" as const, audio: "Hinglish", volume: 0.4, muted: true };
  const back = fromStored(JSON.parse(JSON.stringify(toStored(s))), NOW);
  assert.equal(back.speed, 1.35);
  assert.equal(back.subLang, "en");
  assert.equal(back.subSize, "l");
  assert.equal(back.volume, 0.4);
  assert.equal(back.muted, true);
});
