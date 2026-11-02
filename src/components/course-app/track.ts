"use client";

import { useEffect, useRef } from "react";
import { PRACTICE_KEYS, checkPct, dayOf, nextStep, type CourseState, type LessonProgress } from "@/lib/course-app";
import type { SdEvent } from "@/lib/sd-events";
import { inRange } from "./lesson/Practice";

/*
 * Course activity for the admin: what each learner opened, which steps they
 * finished, how they answered, how far into the video they got. Batched and
 * sent to /api/sd/events; nothing here ever blocks or breaks the lesson.
 */

const ANON_KEY = "klymb.sd.anon";
const URL = "/api/sd/events";
type Props = Record<string, string | number | boolean>;
interface Queued { e: SdEvent; lesson?: string; step?: string; props?: Props; path: string }

const queue: Queued[] = [];
let timer: number | undefined;
let lang = "en";
let enabled = false;

export function anonId(): string {
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) { id = crypto.randomUUID(); window.localStorage.setItem(ANON_KEY, id); }
    return id;
  } catch {
    return "no-storage-anon";
  }
}

function flush(beacon = false) {
  window.clearTimeout(timer);
  timer = undefined;
  if (!queue.length) return;
  const body = JSON.stringify({ anon: anonId(), lang, device: window.innerWidth < 768 ? "phone" : "desktop", events: queue.splice(0, 40) });
  if (beacon && navigator.sendBeacon) navigator.sendBeacon(URL, new Blob([body], { type: "application/json" }));
  else fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  if (queue.length) flush(beacon);
}

export function track(e: SdEvent, lesson?: string | null, step?: string | null, props?: Props) {
  if (!enabled || typeof window === "undefined") return;
  queue.push({ e, lesson: lesson ?? undefined, step: step ?? undefined, props, path: window.location.pathname });
  if (timer === undefined) timer = window.setTimeout(() => flush(), 4000);
}

const join = (a: (number | boolean)[]) => a.map((x) => (typeof x === "boolean" ? (x ? 1 : 0) : x)).join(",");

/** What one newly finished step looked like, for the admin's answer and drop-off views. */
function stepProps(s: CourseState, id: string, key: keyof LessonProgress, p: LessonProgress): Props {
  const c = dayOf(id)?.copy[s.lang];
  if (!c) return {};
  if (key === "post") {
    const picks = p.post ?? [];
    const graded = p.review?.[s.lang] ?? c.post;
    return { qs: c.post.map((q) => q.id).join(","), picks: join(picks), score: graded.filter((q, i) => q.choices[picks[i]]?.best).length, of: c.post.length };
  }
  if (key === "est") return { vals: join(p.est ?? []), inRange: inRange(c.estimates ?? [], p.est ?? []), of: c.estimates?.length ?? 0 };
  if (key === "built") return { wrong: p.built ?? 0 };
  if (key === "drawn") return { score: p.drawn?.score ?? 0, of: p.drawn?.of ?? 0, boxes: p.board?.nodes.length ?? 0, arrows: p.board?.edges.length ?? 0 };
  if (key === "design") return { chars: p.design?.length ?? 0 };
  if (key === "checks") return { ticked: (p.checks ?? []).filter(Boolean).length, of: c.design?.checklist.length ?? 0 };
  if (key === "follow") return { covered: (p.follow ?? []).filter(Boolean).length, of: p.follow?.length ?? 0 };
  return {};
}

const STEP_FIELDS: (keyof LessonProgress)[] = ["watched", "read", "post", "est", "built", "drawn", "design", "checks", "follow"];

/** Watches the course state and reports what changed. Off in design previews. */
export function useActivity(s: CourseState, ready: boolean, preview: boolean) {
  const prev = useRef<CourseState | null>(null);
  const on = ready && !preview;

  useEffect(() => {
    enabled = on;
    if (!on) return;
    const hide = () => { if (document.visibilityState === "hidden") flush(true); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", () => flush(true));
    return () => document.removeEventListener("visibilitychange", hide);
  }, [on]);

  useEffect(() => { lang = s.lang; }, [s.lang]);

  // Screens and lessons opened.
  useEffect(() => {
    if (!on) return;
    track("screen", s.screen === "player" ? s.cur : null, null, { screen: s.screen });
    if (s.screen === "player") track("lesson_open", s.cur);
  }, [on, s.screen, s.cur]);

  // Steps finished, days completed, settings flipped: diffed against the last state seen.
  useEffect(() => {
    if (!on) return;
    const before = prev.current;
    prev.current = s;
    if (!before) return;
    if (before.lessons !== s.lessons) {
      for (const [id, p] of Object.entries(s.lessons)) {
        const was = before.lessons[id] ?? {};
        for (const key of STEP_FIELDS) {
          if (p[key] !== undefined && p[key] !== false && JSON.stringify(p[key]) !== JSON.stringify(was[key])) track("step_done", id, key, stepProps(s, id, key, p));
        }
      }
    }
    // Every lesson-check attempt, passes and misses alike.
    for (const [id, p] of Object.entries(s.lessons)) {
      if (p.tries && p.tries !== before.lessons[id]?.tries) {
        // The lesson carries no answers: the review that came back with the grade does.
        const qs = p.review?.[s.lang] ?? dayOf(id)?.copy[s.lang].post ?? [];
        track("step_done", id, "check", { qs: qs.map((q) => q.id).join(","), picks: join(p.checkPicks ?? []), pct: checkPct(qs, p.checkPicks ?? []), passed: !p.failed && !!p.post, try: p.tries });
      }
    }
    for (const id of s.done) if (!before.done.includes(id)) track("day_complete", id);
    if (before.subs !== s.subs || before.subLang !== s.subLang) track("subs", s.cur, null, { on: s.subs, lang: s.subLang });
    if (before.lang !== s.lang) track("lang", s.cur, null, { lang: s.lang });
  }, [on, s]);

  // Where they are, every 30 seconds while a lesson is open and on screen: time per step.
  const latest = useRef(s);
  useEffect(() => { latest.current = s; }, [s]);
  useEffect(() => {
    if (!on) return;
    const iv = window.setInterval(() => {
      const st = latest.current;
      const day = dayOf(st.cur);
      if (st.screen !== "player" || !day || document.visibilityState !== "visible") return;
      const cur = PRACTICE_KEYS.includes(st.stage) ? st.stage : nextStep(st, st.cur, day);
      track("ping", st.cur, cur, { t: Math.round(st.t), playing: st.playing });
    }, 30000);
    return () => window.clearInterval(iv);
  }, [on]);
}
