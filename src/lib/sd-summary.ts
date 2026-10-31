/**
 * Turns raw System Design course activity into what the admin shows: funnels,
 * time per step, answers, feedback and a per-learner view. Pure, so it is tested
 * without a database.
 */
import type { Day, Question } from "@/data/system-design/types";
import { lessonDay } from "@/lib/course-app";

export interface SdEventRow {
  created_at: string;
  anon_id: string;
  email: string | null;
  event: string;
  lesson: string | null;
  step: string | null;
  props: Record<string, unknown> | null;
  lang: string | null;
  device: string | null;
}

export interface SdFeedbackRow {
  created_at: string;
  anon_id: string;
  email: string | null;
  lesson: string;
  rating: number;
  clarity: string | null;
  will_finish: string | null;
  improve: string | null;
  lang: string | null;
}

export const PING_SECONDS = 30;

/** The lesson's stages in order, each with how it shows up in the events. */
export const STAGES: { key: string; label: string; hit: (e: SdEventRow) => boolean }[] = [
  { key: "open", label: "Opened the lesson", hit: (e) => e.event === "lesson_open" },
  { key: "started", label: "Pressed Start", hit: (e) => e.event === "step_done" && e.step === "started" },
  { key: "pre", label: "Your call", hit: (e) => e.event === "step_done" && e.step === "pre" },
  { key: "watched", label: "Watched the video", hit: (e) => e.event === "step_done" && e.step === "watched" },
  { key: "read", label: "Learn", hit: (e) => e.event === "step_done" && (e.step === "read" || e.step === "post") },
  { key: "post", label: "Prove it", hit: (e) => e.event === "step_done" && e.step === "post" },
  { key: "est", label: "Estimate", hit: (e) => e.event === "step_done" && e.step === "est" },
  { key: "built", label: "Build it", hit: (e) => e.event === "step_done" && e.step === "built" },
  { key: "design", label: "Design it", hit: (e) => e.event === "step_done" && e.step === "design" },
  { key: "follow", label: "Follow-ups", hit: (e) => e.event === "step_done" && e.step === "follow" },
  { key: "complete", label: "Completed the day", hit: (e) => e.event === "day_complete" },
];

const STEP_LABEL: Record<string, string> = {
  call: "Your call", watch: "Watch", reveal: "Learn", prove: "Prove it", estimate: "Estimate", build: "Build it", design: "Design it", follow: "Follow-ups", done: "Done",
};

const count = <T,>(xs: T[], key: (x: T) => string | null | undefined) => {
  const m = new Map<string, number>();
  for (const x of xs) { const k = key(x); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};
const nums = (v: unknown) => (typeof v === "string" ? v.split(",").map(Number) : []);

export function summarise(events: SdEventRow[], feedback: SdFeedbackRow[], days: Record<string, Day>) {
  const visitors = new Set(events.map((e) => e.anon_id));
  const signedIn = new Set(events.filter((e) => e.email).map((e) => e.email!));
  const lastPerAnon = new Map<string, SdEventRow>();
  for (const e of events) lastPerAnon.set(e.anon_id, e);

  // Each anon's first seen email (they may sign in mid-way).
  const emailOf = new Map<string, string>();
  for (const e of events) if (e.email && !emailOf.has(e.anon_id)) emailOf.set(e.anon_id, e.email);

  const questions = new Map<string, { q: Question; day: number }>();
  for (const day of Object.values(days)) for (const q of [...day.copy.en.pre, ...day.copy.en.post]) questions.set(q.id, { q, day: day.day });

  const lessons = Object.entries(days).map(([id, day]) => {
    const evs = events.filter((e) => e.lesson === id);
    const funnel = STAGES
      .filter((st) => st.key !== "est" || day.copy.en.estimates?.length)
      .filter((st) => st.key !== "built" || day.copy.en.build)
      .filter((st) => st.key !== "design" || day.copy.en.design)
      .filter((st) => st.key !== "follow" || day.copy.en.followUps?.length)
      .map((st) => ({ label: st.label, value: new Set(evs.filter(st.hit).map((e) => e.anon_id)).size }));

    // Time spent per step: one ping every 30 s while the step is the learner's current one.
    const pings = evs.filter((e) => e.event === "ping" && e.step);
    const time = count(pings, (e) => e.step).map(({ label, value }) => {
      const people = new Set(pings.filter((p) => p.step === label).map((p) => p.anon_id)).size;
      return { label: STEP_LABEL[label] ?? label, value: Math.round(((value * PING_SECONDS) / Math.max(1, people) / 60) * 10) / 10, secondary: `${people} people` };
    });

    // Where people who didn't finish were last seen.
    const finished = new Set(evs.filter((e) => e.event === "day_complete").map((e) => e.anon_id));
    const lastStep = new Map<string, string>();
    for (const e of pings) if (!finished.has(e.anon_id)) lastStep.set(e.anon_id, e.step!);
    const stoppedAt = count([...lastStep.values()], (s) => STEP_LABEL[s] ?? s);

    const video = [25, 50, 75, 100].map((pct) => ({
      label: `${pct}% of the video`,
      value: new Set(evs.filter((e) => e.event === "video_progress" && Number(e.props?.pct) >= pct).map((e) => e.anon_id)).size,
    }));

    // Every answer, the latest attempt per learner per question.
    const picks = new Map<string, Map<string, number>>();
    for (const e of evs) {
      if (e.event !== "step_done" || (e.step !== "pre" && e.step !== "post")) continue;
      const ids = typeof e.props?.qs === "string" ? e.props.qs.split(",") : [];
      const ps = nums(e.props?.picks);
      ids.forEach((qid, i) => { if (!picks.has(qid)) picks.set(qid, new Map()); if (Number.isFinite(ps[i])) picks.get(qid)!.set(e.anon_id, ps[i]); });
    }
    const answers = [...day.copy.en.pre.map((q) => ({ q, kind: "Your call" })), ...day.copy.en.post.map((q) => ({ q, kind: "Prove it" }))].map(({ q, kind }) => {
      const all = [...(picks.get(q.id)?.values() ?? [])];
      const right = all.filter((p) => q.choices[p]?.best).length;
      const wrong = count(all.filter((p) => !q.choices[p]?.best), (p) => q.choices[p]?.text);
      return { id: q.id, kind, prompt: q.scenario ? `${q.scenario} ${q.prompt}` : q.prompt, answered: all.length, right, topWrong: wrong[0] ?? null };
    });

    const estimates = (day.copy.en.estimates ?? []).map((q, i) => {
      const vals = new Map<string, number>();
      for (const e of evs) if (e.event === "step_done" && e.step === "est") { const v = nums(e.props?.vals)[i]; if (Number.isFinite(v)) vals.set(e.anon_id, v); }
      const all = [...vals.values()];
      return { prompt: q.prompt, answer: q.answer, unit: q.unit, answered: all.length, inRange: all.filter((v) => Math.abs(v / q.answer - 1) <= q.tolerance).length };
    });

    const fb = feedback.filter((f) => f.lesson === id);
    return {
      id, day: day.day, app: day.app, funnel, time, stoppedAt, video, answers, estimates,
      feedback: {
        count: fb.length,
        avg: fb.length ? Math.round((fb.reduce((a, f) => a + f.rating, 0) / fb.length) * 10) / 10 : null,
        ratings: [5, 4, 3, 2, 1].map((n) => ({ label: `${n} ★`, value: fb.filter((f) => f.rating === n).length })),
        clarity: count(fb, (f) => f.clarity),
        willFinish: count(fb, (f) => f.will_finish),
      },
    };
  });

  const learners = [...visitors].map((anon) => {
    const mine = events.filter((e) => e.anon_id === anon);
    const done = [...new Set(mine.filter((e) => e.event === "day_complete").map((e) => e.lesson))];
    const steps = new Set(mine.filter((e) => e.event === "step_done").map((e) => `${e.lesson}:${e.step}`));
    const last = lastPerAnon.get(anon)!;
    const lastStep = [...mine].reverse().find((e) => e.event === "ping" || e.event === "step_done");
    return {
      anon, email: emailOf.get(anon) ?? null, first: mine[0].created_at, last: last.created_at,
      events: mine.length, stepsDone: steps.size, done: done.filter(Boolean) as string[],
      where: lastStep ? `${lastStep.lesson && /^\d+-\d+$/.test(lastStep.lesson) ? lessonDay(lastStep.lesson) : lastStep.lesson} · ${STEP_LABEL[lastStep.step ?? ""] ?? lastStep.step}` : "Browsing",
      device: last.device, lang: last.lang,
      minutes: Math.round((mine.filter((e) => e.event === "ping").length * PING_SECONDS) / 60),
    };
  }).sort((a, b) => (a.last < b.last ? 1 : -1));

  return {
    totals: {
      visitors: visitors.size,
      signedIn: signedIn.size,
      started: new Set(events.filter((e) => e.event === "step_done" && e.step === "started").map((e) => e.anon_id)).size,
      completedAny: new Set(events.filter((e) => e.event === "day_complete").map((e) => e.anon_id)).size,
      feedback: feedback.length,
      avgRating: feedback.length ? Math.round((feedback.reduce((a, f) => a + f.rating, 0) / feedback.length) * 10) / 10 : null,
    },
    lessons,
    lang: count([...lastPerAnon.values()], (e) => (e.lang === "hi" ? "Hinglish" : e.lang === "en" ? "English" : null)),
    device: count([...lastPerAnon.values()], (e) => (e.device === "phone" ? "Phone" : e.device === "desktop" ? "Desktop" : null)),
    screens: count(events.filter((e) => e.event === "screen"), (e) => String(e.props?.screen ?? "")),
    welcome: count(events.filter((e) => e.event === "welcome"), (e) => (e.props?.choice === "day0" ? "Started Day 1" : "Took the baseline first")),
    tour: count(events.filter((e) => e.event === "tour"), (e) => (e.props?.action === "finished" ? "Finished the tour" : `Skipped at stop ${e.props?.at}`)),
    subsOff: new Set(events.filter((e) => e.event === "subs" && e.props?.on === false).map((e) => e.anon_id)).size,
    shares: events.filter((e) => e.event === "share").length,
    overview: {
      played: new Set(events.filter((e) => e.event === "video_play" && e.lesson === "overview").map((e) => e.anon_id)).size,
      finished: new Set(events.filter((e) => e.event === "video_progress" && e.lesson === "overview" && Number(e.props?.pct) >= 100).map((e) => e.anon_id)).size,
    },
    signins: count(events.filter((e) => e.event === "signin"), (e) => ({ welcome: "Welcome screen", "day-done": "End of a day", home: "Home", profile: "Profile", recap: "Module complete" })[String(e.props?.where)] ?? "Other"),
    comments: feedback.filter((f) => f.improve).slice(0, 60),
    learners,
  };
}

export type SdSummary = ReturnType<typeof summarise>;
