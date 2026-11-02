import {
  BUILT_LESSONS,
  MODULES,
  NOTIFICATIONS,
  QUESTIONS,
  TIMED_SECONDS,
  type Notif,
  type Question,
  type QuickCheck,
} from "@/data/system-design/course-app";
import type { Day, Lang, Question as ChoiceQuestion } from "@/data/system-design/types";
import type { Board } from "@/lib/canvas";

/**
 * State and transitions for the System Design course app. Everything here is
 * pure: the component layer owns timers, storage and the DOM. `t` is the
 * lesson video's playhead in seconds, reported by the <video> element.
 */

export type Screen =
  | "splash" | "onboard" | "commit" | "home" | "course" | "progress" | "profile"
  | "player" | "quiz" | "results" | "notifs" | "recap";
export type Tab = "home" | "course" | "progress" | "profile";
export type PlayerTab = "lessons" | "qna" | "notes";
/** "pre" is the retired course baseline; only the final assessment ("post") is taken now. */
export type QuizKind = "pre" | "post";
export type Answer = number | number[] | string;

export interface Note { t: number; text: string }

/** A lesson's own steps: the video, learn, prove it, build it, follow-ups. */
export interface LessonProgress {
  /** Sent the end-of-day feedback. */
  feedback?: boolean;
  watched?: boolean; read?: boolean; post?: number[];
  /** Estimate answers, as typed. */
  est?: number[];
  built?: number;
  /** "Draw it": the learner's own board, saved as they go, and its result once checked. */
  board?: Board; drawn?: { score: number; of: number };
  /** The design attempt, and the self-check ticks after the walkthrough. */
  design?: string; checks?: boolean[];
  follow?: boolean[];
  /**
   * The lesson check ("Prove it"): 5 questions, 60% to pass. `post` holds the
   * passing attempt's picks; `check` is the best score so far (0–100); the
   * last attempt's picks stay in `checkPicks` for its results. A fail sets
   * `failed`, and a retake opens once the video is watched again (`rewatched`).
   */
  check?: number; checkPicks?: number[]; tries?: number; failed?: boolean; rewatched?: boolean;
  /** The answers and why, from the server once an attempt is graded. The lesson itself doesn't carry them. */
  review?: Record<Lang, ChoiceQuestion[]>;
  /** Seconds of video actually played since the last miss; skipping ahead does not count. */
  rewatchSec?: number;
}

export interface CourseState {
  screen: Screen;
  tab: Tab;
  onboarded: boolean;
  onb: number;
  splashUntil: number;
  /** Current lesson id, "module-lesson", zero-based. */
  cur: string;
  t: number;
  playing: boolean;
  speed: number;
  /** The learner has opened a lesson, so the mini player may show. */
  visited: boolean;
  miniHide: string | null;
  ended: boolean;
  upNext: number;
  notes: Record<string, Note[]>;
  draft: string;
  ptab: PlayerTab;
  openMod: number;
  done: string[];
  quiz: { kind: QuizKind; stage: "intro" | "q"; idx: number; answers: Record<number, Answer> };
  timeLeft: number;
  confirmExit: boolean;
  /** 1 = correct, 0 = not, per question. */
  pre: number[];
  post: number[] | null;
  lastKind: QuizKind;
  qcOpen: boolean;
  qcPick: number | null;
  qcDone: string[];
  notifs: Notif[];
  offline: boolean;
  vidErr: boolean;
  recapMod: number;
  goal: number;
  remind: string;
  autoplay: boolean;
  quality: "auto" | "hd" | "saver";
  wifiOnly: boolean;
  streakRem: boolean;
  replyNotif: boolean;
  todaySec: number;
  /** Local date (YYYY-MM-DD) that `todaySec` counts. */
  today: string;
  toast: string | null;
  toastUntil: number;
  /** Per-lesson practice progress, by lesson id. */
  lessons: Record<string, LessonProgress>;
  /** Language of the lesson content; the app's own labels stay English. */
  lang: Lang;
  /** Subtitles under the lesson video, in `subLang`, at `subSize`. */
  subs: boolean;
  subLang: SubLang;
  subSize: SubSize;
  /** Voice-over language of the lesson video, by its label ("Hinglish"). Falls back to the original when a lesson lacks it. */
  audio: string;
  /** 0–1. */
  volume: number;
  muted: boolean;
  /** Saw (or skipped) Kamran's tour of the lesson screen. */
  toured: boolean;
  /** Preview only: which tour stop `?start=tourN` opens on. */
  tourStep?: number;
  /**
   * Which step the lesson's main column is showing. One step at a time, in
   * place of the video: nothing scrolls, and finishing one opens the next.
   */
  stage: StepKey;
  /** The assessment is mid-attempt, so stepping away would lose it (not saved: a reload returns to the video). */
  checkBusy: boolean;
  /** Where the lesson assessment is: the intro card, the questions, the results, or the passed row. */
  checkStage: CheckStage;
  /** Question the assessment is on (the N in "N / 5"), and the estimate / follow-up the extra practice is on. */
  checkIdx: number;
  estIdx: number;
  fuIdx: number;
  /** Local dates (YYYY-MM-DD) with any finished step: the streak. */
  activeDays: string[];
  /** The promise made after the welcome: signed name and local date. */
  commitment: { name: string; date: string } | null;
  /** The streak pop-up is open; `popDay` is the last day it was shown (once a day, on the first pass). */
  streakPop: boolean;
  popDay: string;
  /** A lesson this viewer hasn't bought was asked for: the offer is showing. */
  paywall: boolean;
}

/** How many of `picks` landed on the best choice. */
export const score = (questions: ChoiceQuestion[], picks: number[]) =>
  picks.filter((p, k) => questions[k]?.choices[p]?.best).length;

export type StepKey = "watch" | "reveal" | "prove" | "estimate" | "build" | "draw" | "design" | "follow" | "done";

export type CheckStage = "intro" | "q" | "result" | "passed";

/** The assessment view a lesson opens on: the results after a miss, the passed row after a pass, else the intro. */
export function checkStageFor(p?: LessonProgress): CheckStage {
  if (p?.failed) return "result";
  if (p?.post) return "passed";
  return "intro";
}

/**
 * The day's parts numbered as one run: the check's questions, then the
 * estimates, the build, the drawing, the design and the follow-ups, as many as the day has.
 * `first` is where each part's numbering starts. The assessment is the check alone; the
 * rest is the optional extra practice, counted from one on its own (see `practiceStep`).
 */
export function assessmentParts(id: string, lang: Lang = "en") {
  const c = dayOf(id)?.copy[lang];
  const sizes = { prove: c?.post.length ?? 0, estimate: c?.estimates?.length ?? 0, build: c?.build ? 1 : 0, draw: c?.canvas ? 1 : 0, design: c?.design ? 1 : 0, follow: c?.followUps?.length ?? 0 };
  const order = ["prove", "estimate", "build", "draw", "design", "follow"] as const;
  const first = {} as Record<(typeof order)[number], number>;
  let n = 1;
  for (const k of order) { first[k] = n; n += sizes[k]; }
  return { total: n - 1, first, sizes };
}

/** The optional extra practice, in order. It never gates finishing the lesson. */
export const PRACTICE_KEYS: StepKey[] = ["estimate", "build", "draw", "design", "follow"];

/** How many parts the extra practice has: everything in the day but the check. */
export const practiceTotal = (id: string, lang: Lang = "en") => { const { total, sizes } = assessmentParts(id, lang); return total - sizes.prove; };

/**
 * The big "N / 5" in the assessment header while the check's questions run.
 * Zero on the intro card, on the results, and outside the check: no counter to
 * show there. The extra practice has its own count, `practiceStep`.
 */
export function assessmentStep(s: CourseState): number {
  return s.stage === "prove" && s.checkStage === "q" ? s.checkIdx + 1 : 0;
}

/** The "N / total" inside the extra practice, counted from one after the check. Zero once a part is done. */
export function practiceStep(s: CourseState, id: string): number {
  const p: LessonProgress = s.lessons[id] ?? {};
  const { first, sizes } = assessmentParts(id, s.lang);
  const at = (k: keyof typeof first) => first[k] - sizes.prove;
  switch (s.stage) {
    case "estimate": return p.est ? 0 : at("estimate") + s.estIdx;
    case "build": return p.built === undefined ? at("build") : 0;
    case "draw": return p.drawn ? 0 : at("draw");
    case "design": return p.design ? 0 : at("design");
    case "follow": return p.follow ? 0 : at("follow") + Math.min(s.fuIdx, Math.max(sizes.follow - 1, 0));
    default: return 0;
  }
}

/** The lesson's steps in order: watch → learn → prove it → (extra practice) → done. Only watch and prove it gate the day; the practice is optional. */
export function lessonSteps(s: CourseState, id: string, day: Day) {
  const c = day.copy[s.lang];
  const p: LessonProgress = s.lessons[id] ?? {};
  const steps: { key: StepKey; done: boolean; open: boolean }[] = [
    { key: "watch", done: !!p.watched, open: true },
    { key: "reveal", done: !!p.read || !!p.post, open: !!p.watched },
    { key: "prove", done: !!p.post, open: !!p.watched },
  ];
  const add = (key: StepKey, done: boolean) => steps.push({ key, done, open: !!p.post });
  if (c.estimates?.length) add("estimate", !!p.est);
  if (c.build) add("build", p.built !== undefined);
  if (c.canvas) add("draw", !!p.drawn);
  if (c.design) add("design", !!p.design);
  if (c.followUps?.length) add("follow", !!p.follow);
  steps.push({ key: "done", done: s.done.includes(id), open: flowDone(s, id) });
  return steps;
}

/** The first extra-practice part the lesson has, or null when it has none. */
export function practiceStart(s: CourseState, id: string): StepKey | null {
  const d = dayOf(id);
  if (!d) return null;
  return lessonSteps(s, id, d).find((x) => PRACTICE_KEYS.includes(x.key))?.key ?? null;
}

/** The next required step: the first one not done, leaving the optional practice out. */
export function nextStep(s: CourseState, id: string, day: Day): StepKey {
  return lessonSteps(s, id, day).find((x) => !x.done && !PRACTICE_KEYS.includes(x.key))?.key ?? "done";
}

/**
 * The step a lesson opens on: the first required one still to do, or the video
 * when the day is finished. "Learn" is never it — the day runs video →
 * assessment → share and choose, and what really happened is reference, opened
 * from the step bar. A lesson passed but not completed opens on the choice.
 */
export function stageFor(s: CourseState, id: string): StepKey {
  const d = dayOf(id);
  if (!d) return "watch";
  return lessonSteps(s, id, d).find((x) => x.open && !x.done && x.key !== "reveal" && !PRACTICE_KEYS.includes(x.key))?.key ?? "watch";
}

/** The lesson check: questions per lesson and the share needed to pass. */
export const CHECK_SIZE = 5;
export const PASS_MARK = 0.6;

export const LESSON_COUNT = MODULES.reduce((n, m) => n + m.lessons.length, 0);
export const ALL_IDS = MODULES.flatMap((m, mi) => m.lessons.map((_, li) => `${mi}-${li}`));
/** Playback speed: preset steps, and the range the fine control allows. */
export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.5;
export type SubLang = "hinglish" | "en";
export type SubSize = "s" | "m" | "l";
export const SUB_LANGS: [SubLang, string][] = [["hinglish", "Hinglish"], ["en", "English"]];
/** Tabs keep a lesson playing in the mini player. */
export const TAB_SCREENS: Screen[] = ["home", "course", "progress", "profile"];

export const sec = (d: string) => {
  const [m, s] = d.split(":");
  return Number(m) * 60 + Number(s);
};
export const fmt = (s: number) => {
  const v = Math.max(0, Math.floor(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
};
export const pad = (n: number) => String(n).padStart(2, "0");
export const pct = (a: number[]) => (a.length ? `${Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100)}%` : "—");
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function lesson(id: string) {
  const [mi, li] = id.split("-").map(Number);
  const m = MODULES[mi];
  return { mi, li, m, title: m.lessons[li][0], dur: m.lessons[li][1], secs: sec(m.lessons[li][1]), code: `D${ALL_IDS.indexOf(id)}` };
}

export const moduleIds = (mi: number) => MODULES[mi].lessons.map((_, li) => `${mi}-${li}`);
export const moduleMinutes = (mi: number) => Math.round(MODULES[mi].lessons.reduce((a, l) => a + sec(l[1]), 0) / 60);
/** Each lesson's quick check sits at 45% of the video. */
export const quickCheckAt = (id: string) => Math.round(lesson(id).secs * 0.44);
/** The lesson can't play: a simulated load error, or offline. */
export const blocked = (s: CourseState) => s.vidErr || s.offline;
export const miniActive = (s: CourseState) => MINI_PLAYER && s.visited && TAB_SCREENS.includes(s.screen) && s.miniHide !== s.cur;
export const allNotes = (s: CourseState) => Object.values(s.notes).flat();

/** The mini player needs a video that keeps playing off the lesson screen; lessons stop when you leave for now. */
export const MINI_PLAYER = false;
/** One lesson as the server hands it to the app. */
export interface LessonContent { day: Day; subtitles: Record<SubLang, [number, string][]>; quickCheck?: QuickCheck }

let content: Record<string, LessonContent> = {};
/**
 * The lessons this viewer may open, from the server, set once on mount in the
 * browser. Paid lessons aren't in the bundle, so this is the only way they arrive.
 */
export const setLessons = (lessons: Record<string, LessonContent>) => { content = lessons; };

/** The lesson's full content, or undefined while it's coming soon or unpaid. */
export const dayOf = (id: string) => content[id]?.day;
export const isSoon = (id: string) => !BUILT_LESSONS.includes(id);
/** Out, but this viewer hasn't bought it. */
export const isPaywalled = (id: string) => !isSoon(id) && !content[id];
export const quickCheckOf = (id: string) => content[id]?.quickCheck;
export const hasQuickCheck = (id: string) => !!quickCheckOf(id);
export const lessonDay = (id: string) => { const d = dayOf(id); return d ? `Day ${d.day}` : `Day ${ALL_IDS.indexOf(id) + 1}`; };

/** The lesson can be finished: the video is watched and the check passed. The extra practice is optional. */
export function flowDone(s: CourseState, id: string) {
  if (!dayOf(id)) return false;
  const p = s.lessons[id] ?? {};
  return !!(p.watched && p.post);
}

/** Saves a lesson step and counts today towards the streak. */
export function updateLesson(s: CourseState, id: string, patch: Partial<LessonProgress> | null, now = Date.now()): CourseState {
  const today = localDate(new Date(now));
  const activeDays = s.activeDays.includes(today) ? s.activeDays : [...s.activeDays, today];
  return { ...s, lessons: { ...s.lessons, [id]: patch ? { ...(s.lessons[id] ?? {}), ...patch } : {} }, activeDays };
}

const dayKey = (d: Date) => localDate(d);
/** Current streak (days in a row up to today, or up to yesterday if today isn't done yet) and the longest run. */
export function streak(s: CourseState, now = Date.now()) {
  const days = new Set(s.activeDays);
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(d))) { current++; d.setDate(d.getDate() - 1); }
  const sorted = [...days].sort();
  let longest = 0, run = 0, prev: Date | null = null;
  for (const k of sorted) {
    const [y, m, dd] = k.split("-").map(Number);
    const cur = new Date(y, m - 1, dd);
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 864e5) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  return { current, longest, today: days.has(localDate(new Date(now))) };
}

/** 1 if the answer is right. Short answers pass when they name both consistency and availability. */
export function grade(q: Question, a: Answer | undefined): number {
  switch (q.type) {
    case "mcq":
    case "timed":
    case "diagram":
      return a === q.ans ? 1 : 0;
    case "multi":
      return Array.isArray(a) && a.length === q.ans.length && q.ans.every((x) => a.includes(x)) ? 1 : 0;
    case "order":
      return ((Array.isArray(a) ? a : q.start) as number[]).every((v, i) => v === i) ? 1 : 0;
    case "text": {
      const t = (typeof a === "string" ? a : "").toLowerCase();
      return /consisten/.test(t) && /availab/.test(t) ? 1 : 0;
    }
  }
}

/** Whether the question has an answer good enough to enable Next. */
export function isAnswered(q: Question, a: Answer | undefined) {
  if (q.type === "order") return true;
  if (q.type === "multi") return Array.isArray(a) && a.length > 0;
  if (q.type === "text") return typeof a === "string" && a.trim().length > 3;
  return a !== undefined;
}

const toast = (msg: string, now: number, ms = 2600) => ({ toast: msg, toastUntil: now + ms });

/** A first visit: nothing done, no baseline yet, the course opens on Day 1. */
export function defaultState(now = Date.now()): CourseState {
  return {
    screen: "splash", tab: "home", onboarded: false, onb: 0, splashUntil: now + 1800,
    cur: "0-0", t: 0, playing: false, speed: 1, visited: false, miniHide: null, ended: false, upNext: 0,
    notes: {}, draft: "", ptab: "lessons", openMod: 0, done: [],
    quiz: { kind: "pre", stage: "intro", idx: 0, answers: {} }, timeLeft: TIMED_SECONDS, confirmExit: false,
    pre: [], post: null, lastKind: "pre",
    qcOpen: false, qcPick: null, qcDone: [],
    notifs: NOTIFICATIONS,
    offline: false, vidErr: false, recapMod: 0,
    goal: 15, remind: "19:00", autoplay: false, quality: "auto", wifiOnly: true, streakRem: true, replyNotif: true,
    todaySec: 0, today: localDate(new Date(now)),
    toast: null, toastUntil: 0,
    commitment: null, streakPop: false, popDay: "", paywall: false,
    lessons: {}, lang: "en", subs: false, subLang: "en", subSize: "m", audio: "Hinglish", volume: 1, muted: false,
    toured: false, stage: "watch", checkBusy: false, checkStage: "intro", checkIdx: 0, estIdx: 0, fuIdx: 0, activeDays: [],
  };
}

/** Screens the app can open on with `?start=`, matching the design canvas frames. */
export const START_SCREENS = [
  "home", "course", "player", "post", "q", "results", "progress", "qc", "mini", "exit",
  "commit", "commitdone", "streak", "lesson", "lessonpass", "lessonfail", "retake",
  "splash", "onboard", "onboard2", "profile", "notifs", "notifsempty", "discuss", "recap", "offline", "videoerr",
  "tour1", "tour2", "tour3", "tour4", "tour5", "playing", "paused", "tabqna", "tabnotes", "notesempty", "vidoffline",
  "learn", "checkintro", "checkq", "checkpass", "checkfail", "checkpassed", "estq", "build", "builddone", "design", "designwalk", "followq", "followdone", "daydone",
] as const;
export type StartScreen = (typeof START_SCREENS)[number];

/** A preview state for one design frame. `q` picks the question for "q"; `seedPost` adds a finished post-assessment. */
export function previewState(start: StartScreen, opts: { q?: number; seedPost?: boolean } = {}, now = Date.now()): CourseState {
  const s: CourseState = {
    ...defaultState(now), screen: "home", onboarded: true, toured: true, done: ["0-0"], cur: "0-1",
    lessons: { "0-0": { watched: true, read: true, post: [0, 0, 0, 0, 1], check: 80, checkPicks: [0, 0, 0, 0, 1], tries: 1 } },
    commitment: { name: "Priya Sharma", date: localDate(new Date(now)) },
  };
  /** Day 1 opened past the video, with the check in some state. These frames are about the check, so the column shows it. */
  const atCheck = (p: Partial<LessonProgress>): CourseState => ({
    ...s, screen: "player", visited: true, stage: "prove", checkStage: checkStageFor(p), lessons: { ...s.lessons, "0-1": { watched: true, read: true, ...p } },
  });
  /** Day 1 past the assessment, so the practice stages have something to stand on. */
  const passed: LessonProgress = { watched: true, read: true, post: [0, 0, 0, 0, 1], check: 80, checkPicks: [0, 0, 0, 0, 1], tries: 1, est: [260, 30000, 250] };
  const atStage = (stage: StepKey, p: Partial<LessonProgress> = {}): CourseState => ({
    ...s, screen: "player", visited: true, stage, lessons: { ...s.lessons, "0-1": { ...passed, ...p } },
  });
  if (opts.seedPost) s.post = [1, 1, 1, 1, 0, 1];
  switch (start) {
    case "course": return { ...s, screen: "course", tab: "course", openMod: lesson(s.cur).mi };
    case "progress": return { ...s, screen: "progress", tab: "progress" };
    case "player": return { ...s, screen: "player", visited: true, notes: { "0-1": [{ t: 52, text: "API = the agreed way to ask the server" }, { t: 131, text: "No response is not proof the save failed" }] } };
    case "post": return { ...s, screen: "quiz", quiz: { kind: "post", stage: "intro", idx: 0, answers: {} } };
    case "commit": return { ...s, screen: "commit", commitment: null };
    case "commitdone": return { ...s, screen: "commit" };
    case "streak": return { ...s, activeDays: [localDate(new Date(now))], streakPop: true };
    case "lesson": return atCheck({});
    case "lessonpass": return atCheck({ post: [0, 0, 0, 0, 1], check: 80, checkPicks: [0, 0, 0, 0, 1], tries: 1 });
    case "lessonfail": return atCheck({ check: 40, checkPicks: [0, 1, 1, 0, 2], tries: 1, failed: true });
    case "retake": return atCheck({ check: 40, checkPicks: [0, 1, 1, 0, 2], tries: 1, failed: true, rewatched: true });
    case "q": {
      const i = Math.min(Math.max(opts.q ?? 0, 0), QUESTIONS.length - 1);
      const answers: Record<number, Answer> = {};
      if (i === 0) answers[0] = 0;
      if (i === 1) answers[1] = [0];
      if (i === 2) answers[2] = 1;
      return { ...s, screen: "quiz", quiz: { kind: "post", stage: "q", idx: i, answers } };
    }
    case "splash": return { ...s, screen: "splash", onboarded: false, splashUntil: now + 1800 };
    case "onboard": return { ...s, screen: "onboard", onboarded: false };
    case "onboard2": return { ...s, screen: "onboard", onboarded: false, onb: 2 };
    case "profile": return { ...s, screen: "profile", tab: "profile" };
    case "notifs": return { ...s, screen: "notifs" };
    case "notifsempty": return { ...s, screen: "notifs", notifs: [] };
    case "recap": return { ...s, screen: "recap", recapMod: 0, done: ["0-0"], cur: "0-1", t: 0, notes: { "0-0": [{ t: 40, text: "Checking stock is not claiming it" }] } };
    case "offline": return { ...s, screen: "course", tab: "course", offline: true };
    case "videoerr": return { ...s, screen: "player", visited: true, t: 96, vidErr: true, lessons: { ...s.lessons, "0-1": { watched: true } } };
    case "vidoffline": return { ...s, screen: "player", visited: true, t: 96, offline: true, lessons: { ...s.lessons, "0-1": { watched: true } } };
    case "mini": return { ...s, visited: true, playing: true };
    case "tour1": return { ...s, screen: "player", visited: true, toured: false, tourStep: 0 };
    case "tour2": return { ...s, screen: "player", visited: true, toured: false, tourStep: 1 };
    case "tour3": return { ...s, screen: "player", visited: true, toured: false, tourStep: 2 };
    case "tour4": return { ...s, screen: "player", visited: true, toured: false, tourStep: 3 };
    case "tour5": return { ...s, screen: "player", visited: true, toured: false, tourStep: 4 };
    case "playing": return { ...s, screen: "player", visited: true, t: 96, playing: true, subs: true, lessons: { ...s.lessons, "0-1": { watched: true } } };
    case "paused": return { ...s, screen: "player", visited: true, t: 96, subs: true, lessons: { ...s.lessons, "0-1": { watched: true } } };
    case "tabqna": return { ...s, screen: "player", visited: true, ptab: "qna" };
    case "tabnotes": return {
      ...s, screen: "player", visited: true, ptab: "notes", t: 96, draft: "Server checks: who, allowed, valid",
      lessons: { ...s.lessons, "0-1": { watched: true } },
      notes: { "0-1": [{ t: 52, text: "API = the agreed way to ask the server" }, { t: 131, text: "No response is not proof the save failed" }] },
    };
    case "notesempty": return { ...s, screen: "player", visited: true, ptab: "notes", notes: {} };
    case "exit": return { ...s, screen: "quiz", quiz: { kind: "post", stage: "q", idx: 2, answers: { 0: 0, 1: [0], 2: 1 } }, confirmExit: true };
    case "qc": return { ...s, screen: "player", visited: true, t: quickCheckAt("0-1"), qcOpen: true };
    case "results": return { ...s, screen: "results", post: s.post ?? [1, 1, 1, 1, 0, 1], lastKind: "post" };
    case "learn": return { ...s, screen: "player", visited: true, stage: "reveal", t: 190, ended: true, lessons: { ...s.lessons, "0-1": { watched: true } } };
    case "checkintro": return atCheck({});
    case "checkq": return { ...atCheck({}), checkStage: "q", checkIdx: 1, checkBusy: true };
    case "checkpass": return { ...atCheck({ check: 80, post: [0, 0, 0, 1, 0], checkPicks: [0, 0, 0, 1, 0], tries: 1 }), checkStage: "result" };
    case "checkfail": return { ...atCheck({ check: 40, post: undefined, checkPicks: [0, 1, 1, 0, 2], tries: 1, failed: true }), checkStage: "result" };
    case "checkpassed": return { ...atCheck({ check: 80, post: [0, 0, 0, 1, 0], checkPicks: [0, 0, 0, 1, 0], tries: 1 }), checkStage: "passed" };
    case "estq": return { ...atStage("estimate", { est: undefined }), estIdx: 0 };
    case "build": return atStage("build");
    case "builddone": return atStage("build", { built: 1 });
    case "design": return atStage("design", { built: 0 });
    case "designwalk": return atStage("design", { built: 0, design: "Waiting room in front so only a bit more than the stock gets in. One stock counter in Redis, decremented atomically, so we never sell 1,001. Payments through a queue at under 2,000/s, with an idempotency key per reservation. Trade-off: the “left” badge can be a few seconds stale." });
    case "followq": return { ...atStage("follow", { built: 0, design: "Waiting room in front, then one atomic stock counter so we never sell 1,001." }), fuIdx: 1 };
    case "followdone": return atStage("follow", { built: 0, design: "Waiting room in front, then one atomic stock counter so we never sell 1,001.", follow: [true, false, true, true] });
    case "daydone": return atStage("done", { built: 0, design: "Waiting room in front, then one atomic stock counter so we never sell 1,001.", follow: [true, false, true, true] });
    default: return s;
  }
}

/** Advances one second: splash, today's minutes, toasts and the timed question. */
export function tick(s: CourseState, now = Date.now()): CourseState {
  let n = s;
  const set = (p: Partial<CourseState>) => { n = { ...n, ...p }; };

  if (n.screen === "splash" && n.splashUntil && now > n.splashUntil) set({ screen: "onboard", onb: 0 });

  // The <video> element moves the playhead; here we only count today's minutes while it plays.
  if (n.screen === "player" && n.playing && !blocked(n)) set({ todaySec: n.todaySec + n.speed });
  // The quick check is ungraded: it pauses the video once, partway through.
  if (n.screen === "player" && n.playing && !n.qcOpen && hasQuickCheck(n.cur) && !n.qcDone.includes(n.cur) && n.t >= quickCheckAt(n.cur)) {
    set({ qcOpen: true, playing: false });
  }

  if (n.toast && now > n.toastUntil) set({ toast: null });

  if (n.screen === "quiz" && n.quiz.stage === "q" && QUESTIONS[n.quiz.idx].type === "timed" && !n.confirmExit) {
    if (n.timeLeft <= 1) n = nextQuestion(n);
    else set({ timeLeft: n.timeLeft - 1 });
  }
  return n;
}

export function openLesson(s: CourseState, id: string, now = Date.now(), force = false): CourseState {
  if (isSoon(id)) return { ...s, ...toast(`${lesson(id).title.split(":")[0]} is coming soon`, now) };
  if (isPaywalled(id)) return { ...s, playing: false, paywall: true };
  if (!force && isLocked(s, id)) return { ...s, ...toast("Pass the previous lesson’s assessment to unlock this one", now, 2400) };
  const same = id === s.cur;
  return {
    ...s, screen: "player", cur: id, t: same ? s.t : 0, playing: same ? s.playing : false, visited: true, miniHide: null, ended: false, upNext: 0, qcOpen: false,
    stage: stageFor(s, id), checkBusy: false, checkStage: checkStageFor(s.lessons[id]), checkIdx: 0, estIdx: 0, fuIdx: 0,
  };
}

/** Marks the current lesson done and moves on: to the next lesson, or to the recap when a module is finished. */
export function completeNext(s: CourseState, auto: boolean, now = Date.now()): CourseState {
  if (dayOf(s.cur) && !flowDone(s, s.cur)) return { ...s, ...toast("Pass today’s check first", now) };
  const nextId = ALL_IDS[ALL_IDS.indexOf(s.cur) + 1];
  const done = s.done.includes(s.cur) ? s.done : [...s.done, s.cur];
  const cmi = lesson(s.cur).mi;
  const t = toast(`Lesson complete. ${s.todaySec >= s.goal * 60 ? "Daily goal met." : "Counts toward today’s goal."}`, now);
  // The next lesson starts on its video, not on the step this one finished on.
  const reset = { ended: false, upNext: 0, qcOpen: false, stage: "watch" as StepKey, checkBusy: false, checkStage: "intro" as CheckStage, checkIdx: 0, estIdx: 0, fuIdx: 0 };
  if (moduleIds(cmi).every((id) => done.includes(id)) && (!nextId || lesson(nextId).mi !== cmi)) {
    return { ...s, ...reset, done, cur: nextId ?? s.cur, t: 0, playing: false, screen: "recap", recapMod: cmi, openMod: nextId ? lesson(nextId).mi : cmi };
  }
  if (nextId && isSoon(nextId)) return { ...s, ...reset, ...toast(`Done! ${lesson(nextId).title.split(":")[0]} is coming soon.`, now), done, playing: false, screen: "home", tab: "home" };
  if (nextId && isPaywalled(nextId)) return { ...s, ...reset, done, cur: nextId, t: 0, playing: false, screen: "home", tab: "home", paywall: true };
  if (nextId) return { ...s, ...reset, ...t, done, cur: nextId, t: 0, playing: auto, openMod: lesson(nextId).mi };
  return { ...s, ...reset, ...t, done };
}

export function startQuiz(s: CourseState, kind: QuizKind): CourseState {
  return { ...s, screen: "quiz", quiz: { kind, stage: "intro", idx: 0, answers: {} }, timeLeft: TIMED_SECONDS, playing: false, confirmExit: false };
}

export function setAnswer(s: CourseState, v: Answer): CourseState {
  return { ...s, quiz: { ...s.quiz, answers: { ...s.quiz.answers, [s.quiz.idx]: v } } };
}

/** Next question, or grade the attempt and open the results after the last one. */
export function nextQuestion(s: CourseState): CourseState {
  const q = s.quiz;
  if (q.idx < QUESTIONS.length - 1) return { ...s, quiz: { ...q, idx: q.idx + 1 }, timeLeft: TIMED_SECONDS };
  const scores = QUESTIONS.map((qq, i) => grade(qq, q.answers[i]));
  return { ...s, [q.kind]: scores, lastKind: q.kind, screen: "results", timeLeft: TIMED_SECONDS };
}

/** Toggling an option on a choice question: multi-select adds or removes, the rest pick one. */
export function pickOption(s: CourseState, i: number): CourseState {
  const q = QUESTIONS[s.quiz.idx];
  const a = s.quiz.answers[s.quiz.idx];
  if (q.type === "multi") {
    const cur = Array.isArray(a) ? a : [];
    return setAnswer(s, cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
  }
  return setAnswer(s, i);
}

export function openNotification(s: CourseState, n: Notif): CourseState {
  const base = { ...s, notifs: s.notifs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)) };
  switch (n.go) {
    case "player": return openLesson(base, base.cur);
    case "progress": return { ...base, screen: "progress", tab: "progress" };
    case "course": return { ...base, screen: "course", tab: "course", openMod: lesson(base.cur).mi };
    case "preresults": return { ...base, screen: "results", lastKind: "pre" };
  }
}

export function answerQuickCheck(s: CourseState, i: number): CourseState {
  return s.qcPick === null ? { ...s, qcPick: i } : s;
}

/** Leaves the quick check: keep watching, rewatch the last minute, or skip. */
export function closeQuickCheck(s: CourseState, how: "continue" | "rewatch" | "skip", now = Date.now()): CourseState {
  const base = { ...s, qcOpen: false, qcDone: s.qcDone.includes(s.cur) ? s.qcDone : [...s.qcDone, s.cur], playing: true };
  if (how === "rewatch") return { ...base, t: Math.max(0, quickCheckAt(s.cur) - 60) };
  if (how === "continue") return { ...base, ...toast("Quick check done. Streak safe today.", now) };
  return base;
}

export function addNote(s: CourseState, now = Date.now()): CourseState {
  const text = s.draft.trim();
  if (!text) return s;
  return { ...s, notes: { ...s.notes, [s.cur]: [...(s.notes[s.cur] ?? []), { t: s.t, text }] }, draft: "", ...toast(`Note pinned at ${fmt(s.t)}`, now, 2200) };
}

export function retryVideo(s: CourseState, now = Date.now()): CourseState {
  if (s.vidErr) return { ...s, vidErr: false, ...toast(`Video loaded. Picking up at ${fmt(s.t)}`, now, 2200) };
  return { ...s, ...toast("Still offline", now, 1800) };
}

export function togglePlay(s: CourseState): CourseState {
  if (blocked(s)) return s;
  const d = lesson(s.cur).secs;
  return { ...s, playing: !s.playing, t: s.t >= d ? 0 : s.t, ended: false, upNext: 0 };
}

export function seekTo(s: CourseState, t: number): CourseState {
  return { ...s, t: Math.min(lesson(s.cur).secs, Math.max(0, Math.round(t))), ended: false, upNext: 0 };
}

/** Closing a started assessment asks first; an unstarted one just closes. */
export function closeQuiz(s: CourseState): CourseState {
  if (s.quiz.stage === "q" && Object.keys(s.quiz.answers).length) return { ...s, confirmExit: true };
  return { ...s, screen: s.tab, confirmExit: false };
}

export interface Badge { name: string; description: string; icon: "play" | "target" | "flame" | "zap" | "note" | "trending" | "db" | "award"; on: boolean }

export function badges(s: CourseState, now = Date.now()): Badge[] {
  const modDone = (mi: number) => moduleIds(mi).every((id) => s.done.includes(id));
  const st = streak(s, now);
  return [
    { name: "First lesson", description: "Finished my first System Design lesson.", icon: "play", on: s.done.length > 0 },
    { name: "First pass", description: "Passed my first System Design lesson assessment.", icon: "target", on: Object.values(s.lessons).some((p) => !!p.post) },
    { name: "7-day streak", description: "Kept learning for seven consecutive days.", icon: "flame", on: st.longest >= 7 },
    { name: "Started right", description: "Finished the first System Design module.", icon: "zap", on: modDone(0) },
    { name: "Note taker", description: "Saved three notes from my learning journey.", icon: "note", on: allNotes(s).length >= 3 },
    { name: "Perfect score", description: "Scored 100% on a System Design lesson assessment.", icon: "trending", on: Object.values(s.lessons).some((p) => p.check === 100) },
    { name: "Builder", description: "Submitted my first architecture practice answer.", icon: "db", on: Object.values(s.lessons).some((p) => p.built !== undefined) },
    { name: "Course complete", description: "Finished every lesson in the System Design course.", icon: "award", on: ALL_IDS.every((id) => s.done.includes(id)) },
  ];
}

/** Fields kept in storage between visits. Preview switches and transient UI stay out. */
const PERSISTED = [
  "onboarded", "cur", "t", "speed", "visited", "notes", "openMod", "done", "pre", "post", "qcDone", "notifs",
  "goal", "remind", "autoplay", "quality", "wifiOnly", "streakRem", "replyNotif", "todaySec", "today",
  "lessons", "lang", "subs", "subLang", "subSize", "audio", "volume", "muted", "toured", "activeDays", "commitment", "popDay",
] as const satisfies readonly (keyof CourseState)[];

export function toStored(s: CourseState) {
  return Object.fromEntries(PERSISTED.map((k) => [k, s[k]]));
}

/** Restores saved progress over the defaults. Today's minutes reset on a new day. */
export function fromStored(raw: unknown, now = Date.now()): CourseState {
  const base = defaultState(now);
  if (!raw || typeof raw !== "object") return base;
  const saved = raw as Partial<CourseState>;
  const s: CourseState = { ...base };
  for (const k of PERSISTED) if (k in saved && saved[k] !== undefined) (s as unknown as Record<string, unknown>)[k] = saved[k];
  if (!ALL_IDS.includes(s.cur) || isSoon(s.cur)) s.cur = base.cur;
  if (s.today !== localDate(new Date(now))) Object.assign(s, { todaySec: 0, today: localDate(new Date(now)) });
  s.screen = s.onboarded ? "home" : "splash";
  return s;
}

/** Saved state with its lesson progress removed: the settings and the signed commitment, for when the lessons behind the ids have changed. */
export function settingsOnly(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const progress = new Set(["cur", "t", "notes", "done", "pre", "post", "qcDone", "lessons", "openMod"]);
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !progress.has(k)));
}

/** A Day page's saved progress. `pre` came from the opening quiz those pages had, which this course no longer asks. */
type LegacyProgress = Partial<LessonProgress> & { pre?: number[] };

/** Progress from the standalone Day pages (/system-design/day-N), carried over once on a first visit. */
export function migrateLegacy(s: CourseState, legacy: { day0?: LegacyProgress | null; day1?: LegacyProgress | null; lang?: unknown }, now = Date.now()): CourseState {
  let n = s;
  for (const [id, p] of [["0-0", legacy.day0], ["1-0", legacy.day1]] as const) {
    if (!p || typeof p !== "object" || n.lessons[id]) continue;
    const keep = { ...p };
    delete keep.pre;
    n = updateLesson(n, id, keep, now);
  }
  if ((legacy.lang === "en" || legacy.lang === "hi") && !s.lessons["0-0"] && !s.lessons["1-0"]) n = { ...n, lang: legacy.lang };
  return n;
}

/** `?lesson=<id>`: open straight into that lesson, skipping the splash and intro (links from Instagram land here). */
export function deepLink(s: CourseState, id: string | null, now = Date.now()): CourseState {
  if (!id || !ALL_IDS.includes(id) || isSoon(id)) return s;
  if (isPaywalled(id)) return { ...s, onboarded: true, screen: "course", tab: "course", paywall: true };
  // Back from "Continue with Google" on the welcome, or a first visit: the commitment comes before Day 1.
  if (id === "0-0" && !s.commitment && s.done.length === 0) return { ...s, onboarded: true, tab: "course", cur: id, screen: "commit" };
  // Shared links open their lesson even when it's still locked here.
  return openLesson({ ...s, onboarded: true, tab: "course" }, id, now, true);
}

/** A seat holder this device hasn't seen: no welcome to sit through, just the promises, once. */
export function startEnrolled(s: CourseState): CourseState {
  return { ...s, onboarded: true, screen: s.commitment ? "home" : "commit", tab: "home" };
}

/** Back from a successful payment. */
export function afterPayment(s: CourseState, now = Date.now()): CourseState {
  return { ...startEnrolled(s), ...toast("Payment received. Your seat is confirmed.", now, 4000) };
}

/** Clamped to the allowed range, in steps of 0.05 so the label never shows float noise. */
export function setSpeed(s: CourseState, v: number): CourseState {
  const speed = Math.round(Math.min(SPEED_MAX, Math.max(SPEED_MIN, v)) * 20) / 20;
  return speed === s.speed ? s : { ...s, speed };
}

/** The next preset up or down from the current speed (which may sit between presets). */
export function stepSpeed(s: CourseState, dir: 1 | -1): CourseState {
  const next = dir > 0 ? SPEED_PRESETS.find((p) => p > s.speed + 1e-9) : [...SPEED_PRESETS].reverse().find((p) => p < s.speed - 1e-9);
  return next === undefined ? s : setSpeed(s, next);
}

/** "1×", "1.25×", "0.8×". */
export const speedLabel = (v: number) => `${Number(v.toFixed(2))}×`;

/** Subtitle lines for a lesson in a language, or none. Hinglish are the video's own captions. */
export function subtitleLines(id: string, lang: SubLang): [number, string][] {
  return content[id]?.subtitles[lang] ?? [];
}

/** Languages a lesson has subtitles in. */
export const subtitleLangs = (id: string) => SUB_LANGS.filter(([l]) => subtitleLines(id, l).length > 0);

/** The line being spoken at `t`, or "". */
export function lineAt(lines: [number, string][], t: number) {
  let cur = "";
  for (const [at, text] of lines) if (t >= at) cur = text;
  return cur;
}

/** The voice-overs a lesson's video has: the original first, then any others. */
export function audioTracks(id: string) {
  const v = dayOf(id)?.video;
  if (!v) return [];
  return [{ lang: v.lang, src: v.src, wide: v.wide?.src }, ...(v.audio ?? [])];
}

/** The track to play: the chosen language when this lesson has it, else the original. */
export function audioTrack(s: CourseState, id = s.cur) {
  const all = audioTracks(id);
  return all.find((a) => a.lang === s.audio) ?? all[0];
}

/** Locked until the lesson before it is passed (or done). Lessons not out yet are handled as "coming soon". */
export function isLocked(s: CourseState, id: string) {
  // Learners already in a lesson keep it: the check arrived after they had moved on.
  if (id === s.cur || s.done.includes(id) || Object.keys(s.lessons[id] ?? {}).length) return false;
  const i = ALL_IDS.indexOf(id);
  const prev = ALL_IDS[i - 1];
  if (!prev || !dayOf(prev)) return false;
  return !s.lessons[prev]?.post && !s.done.includes(prev);
}

/** A check attempt's score, 0–100. */
export function checkPct(questions: ChoiceQuestion[], picks: number[]) {
  if (!questions.length) return 0;
  return Math.round((picks.filter((p, k) => questions[k]?.choices[p]?.best).length / questions.length) * 100);
}

export const passed = (pct: number) => pct >= PASS_MARK * 100;

/**
 * Grades a lesson check. A pass saves it as the lesson's "Prove it" and, the
 * first time today, opens the streak pop-up. A fail asks for a rewatch first.
 */
export function submitCheck(s: CourseState, id: string, questions: ChoiceQuestion[], picks: number[], now = Date.now()): CourseState {
  const pct = checkPct(questions, picks);
  const was = s.lessons[id] ?? {};
  const best = Math.max(was.check ?? 0, pct);
  const tries = (was.tries ?? 0) + 1;
  if (!passed(pct)) {
    return updateLesson(s, id, { check: was.post ? best : pct, checkPicks: picks, tries, failed: !was.post, rewatched: false, rewatchSec: 0 }, now);
  }
  const n = updateLesson(s, id, { post: picks, read: true, check: best, checkPicks: picks, tries, failed: false, rewatched: false }, now);
  const today = localDate(new Date(now));
  return n.popDay === today ? n : { ...n, streakPop: true, popDay: today };
}

/** Share of the video that must be played again after a miss before the retake opens. */
export const REWATCH_SHARE = 0.85;

/**
 * Counts video played again after a missed check. Only real playback counts:
 * the caller passes the gap between two time updates, and a jump (a seek or
 * a skip) is too large to be playback, so it adds nothing. `played` and
 * `duration` are both video time, so the share means the same at every speed;
 * the cap on one tick scales with the speed it was played at.
 */
export function addRewatch(s: CourseState, id: string, played: number, duration: number, rate = 1): CourseState {
  const p = s.lessons[id];
  if (!p?.failed || p.rewatched || !(duration > 0) || !(played > 0) || played > 2 * Math.max(1, rate)) return s;
  const sec = (p.rewatchSec ?? 0) + played;
  const n = { ...s, lessons: { ...s.lessons, [id]: { ...p, rewatchSec: sec } } };
  return sec >= duration * REWATCH_SHARE ? markRewatched(n, id) : n;
}

/** After a fail, watching the video again opens the retake. */
export function markRewatched(s: CourseState, id: string): CourseState {
  const p = s.lessons[id];
  return p?.failed && !p.rewatched ? { ...s, lessons: { ...s.lessons, [id]: { ...p, rewatched: true } } } : s;
}

/** Lessons with a check score, for the course list and the averages. */
export function checkScores(s: CourseState) {
  return ALL_IDS.filter((id) => s.lessons[id]?.check !== undefined).map((id) => ({ id, pct: s.lessons[id].check!, passed: !!s.lessons[id].post }));
}

/** The average check score as "75%", or "—" before any. */
export function checkAverage(s: CourseState) {
  const all = checkScores(s);
  return all.length ? `${Math.round(all.reduce((a, x) => a + x.pct, 0) / all.length)}%` : "—";
}

/** Signs the commitment, dated today. */
export function commit(s: CourseState, name: string, now = Date.now()): CourseState {
  return { ...s, commitment: { name: name.trim(), date: localDate(new Date(now)) } };
}

