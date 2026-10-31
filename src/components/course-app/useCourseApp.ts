"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QUESTIONS } from "@/data/system-design/course-app";
import {
  START_SCREENS, afterPayment, dayOf, deepLink, defaultState, fromStored, isAnswered, nextQuestion, settingsOnly, pickOption, previewState, setLessons, startEnrolled, tick, togglePlay, toStored,
  type CourseState, type LessonContent, type StartScreen,
} from "@/lib/course-app";
import { useActivity } from "./track";

/**
 * v3: System Design Essentials. v2 held the earlier lessons under the same
 * lesson ids, so only its settings carry over (see `settingsOnly`). v1 held the
 * design prototype's sample learner, so it isn't read.
 */
const STORAGE_KEY = "klymb.system-design.v3";
const PREVIOUS_KEY = "klymb.system-design.v2";

const read = (k: string): unknown => { try { return JSON.parse(window.localStorage.getItem(k) ?? "null"); } catch { return null; } };

export type Act = (fn: (s: CourseState) => CourseState) => void;

/**
 * The app's one store. Progress is saved to this browser only (there is no
 * backend yet). `?start=<screen>` opens a design-review state instead and
 * saves nothing; `&q=` and `&post=1` set the question and a finished
 * post-assessment, as on the design canvas. `?lesson=<id>` opens straight
 * into a lesson (for links from Instagram and the standalone Day pages).
 * `?paid=1` is the return from checkout. Someone new with no seat and no link
 * to a lesson goes to the offer rather than an empty course.
 */
export function useCourseApp({ lessons, enrolled }: { lessons: Record<string, LessonContent>; enrolled: boolean }) {
  const [s, setS] = useState<CourseState>(() => defaultState());
  const [ready, setReady] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const preview = useRef(false);
  /** `?lesson=` read once: the URL is tidied after, and dev mode runs the effect twice. */
  const link = useRef<string | null | undefined>(undefined);
  const paid = useRef(false);
  const latest = useRef(s);
  useEffect(() => { latest.current = s; }, [s]);

  const act: Act = useCallback((fn) => setS(fn), []);

  useEffect(() => {
    setLessons(lessons);
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    let next: CourseState;
    // The design-review states stand on Day 2, so they need a viewer who has it.
    if (start && (START_SCREENS as readonly string[]).includes(start) && dayOf("0-1")) {
      preview.current = true;
      next = previewState(start as StartScreen, { q: Number(params.get("q") ?? 0), seedPost: params.get("post") === "1" });
    } else {
      const raw = read(STORAGE_KEY);
      next = fromStored(raw ?? settingsOnly(read(PREVIOUS_KEY)));
      if (link.current === undefined) {
        link.current = params.get("lesson");
        paid.current = params.has("paid");
      }
      if (paid.current && enrolled) next = afterPayment(next);
      else if (link.current) next = deepLink(next, link.current);
      else if (enrolled && !next.onboarded) next = startEnrolled(next);
      else if (!next.onboarded) return window.location.replace("/system-design");
      if (link.current || paid.current) window.history.replaceState(null, "", window.location.pathname);
    }
    if (!navigator.onLine) next = { ...next, offline: true };
    // Storage and the URL only exist in the browser, so the first real state arrives after mount.
    setS(next);
    setPreviewing(preview.current);
    setReady(true);
  }, [lessons, enrolled]);

  useEffect(() => {
    if (!ready || preview.current) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(s))); } catch { /* private mode or full: progress just isn't kept */ }
  }, [s, ready]);

  useEffect(() => {
    if (!ready) return;
    const iv = window.setInterval(() => setS((p) => tick(p)), 1000);
    const goOffline = () => setS((p) => ({ ...p, offline: true }));
    const goOnline = () => setS((p) => ({ ...p, offline: false }));
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [ready]);

  // Keyboard: 1–4 or A–D answer, Enter goes on, Space plays or pauses. Typing in a field is left alone.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      const st = latest.current;
      if (st.screen === "quiz" && st.quiz.stage === "q" && !st.confirmExit) {
        const q = QUESTIONS[st.quiz.idx];
        const k = e.key.toLowerCase();
        const i = /^[1-4]$/.test(k) ? Number(k) - 1 : /^[a-d]$/.test(k) ? k.charCodeAt(0) - 97 : -1;
        const count = "options" in q ? q.options.length : q.type === "diagram" ? 3 : 0;
        if (i >= 0 && i < count) {
          setS((p) => pickOption(p, i));
          e.preventDefault();
        } else if (e.key === "Enter" && isAnswered(q, st.quiz.answers[st.quiz.idx])) {
          setS(nextQuestion);
          e.preventDefault();
        }
      } else if (st.screen === "player" && e.key === " " && !st.qcOpen) {
        setS(togglePlay);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useActivity(s, ready, previewing);

  return { s, act, ready };
}
