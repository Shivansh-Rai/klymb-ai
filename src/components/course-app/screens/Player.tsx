"use client";

import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";
import { MODULES } from "@/data/system-design/course-app";
import {
  ALL_IDS, addNote, assessmentStep, audioTrack, checkStageFor, completeNext, dayOf, flowDone, fmt, hasQuickCheck, lesson, lessonDay, lineAt, moduleIds, openLesson, pad, quickCheckAt,
  addRewatch, retryVideo, seekTo, subtitleLines, togglePlay, updateLesson, type CourseState, type PlayerTab,
} from "@/lib/course-app";
import { Icon } from "../icons";
import { Community } from "../lesson/Community";
import { LessonStage } from "../lesson/Practice";
import { Tour } from "../lesson/Tour";
import { track } from "../track";
import { BackButton, Duration, LessonMark, lessonView } from "../ui";
import type { Act } from "../useCourseApp";
import { SUB_SIZE_CLASS, VideoBar, canSubtitle, useMenu, usePlayerKeys } from "./PlayerControls";

/**
 * The lesson video on the dark grid: the 16:9 cut when there is one, else the
 * 9:16 one. Its own controls are hidden; the player's buttons drive it.
 */
function Video({ s, act, subs, bar }: { s: CourseState; act: Act; subs?: boolean; bar: ReactNode }) {
  const day = dayOf(s.cur)!;
  const voice = audioTrack(s)!;
  const wide = !!voice.wide;
  const poster = wide ? day.video.wide?.poster ?? day.video.poster : day.video.poster;
  const ref = useRef<HTMLVideoElement>(null);
  // Watch-through milestones already reported for this lesson's video.
  const marks = useRef<{ id: string; seen: Set<number> }>({ id: "", seen: new Set() });
  // Where playback was at the last time update, to count only real playback after a miss.
  const last = useRef<{ id: string; t: number }>({ id: "", t: 0 });
  const errOffline = s.offline && !s.vidErr;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (s.playing && v.paused) v.play().catch(() => act((p) => ({ ...p, playing: false })));
    if (!s.playing && !v.paused) v.pause();
  }, [s.playing, act]);
  useEffect(() => { if (ref.current) ref.current.playbackRate = s.speed; }, [s.speed]);
  useEffect(() => { const v = ref.current; if (v) { v.volume = s.volume; v.muted = s.muted; } }, [s.volume, s.muted]);
  // Seeks from the scrubber, the ±10s buttons and notes; the video's own progress stays within a second of `t`.
  useEffect(() => { const v = ref.current; if (v && v.readyState > 0 && Math.abs(v.currentTime - s.t) > 1.5) v.currentTime = s.t; }, [s.t]);
  useEffect(() => { if (!s.vidErr) ref.current?.load(); }, [s.vidErr]);

  const onTime = (v: HTMLVideoElement) => {
    const t = v.currentTime;
    // Video played since the last update; a seek makes the gap too big to count.
    const played = !v.paused && last.current.id === s.cur ? t - last.current.t : 0;
    last.current = { id: s.cur, t };
    if (v.duration > 0) {
      if (marks.current.id !== s.cur) marks.current = { id: s.cur, seen: new Set() };
      const pct = Math.min(100, Math.floor((t / v.duration) * 4) * 25);
      if (pct > 0 && !marks.current.seen.has(pct)) { marks.current.seen.add(pct); track("video_progress", s.cur, "watch", { pct }); }
    }
    const seen = v.duration > 0 && t / v.duration >= 0.85;
    act((p) => {
      const lp = p.lessons[p.cur];
      // After a missed check, the retake opens once enough has actually been played again.
      const base = lp?.failed && !lp.rewatched ? addRewatch(p, p.cur, played, v.duration, v.playbackRate) : p;
      const owed = seen && !lp?.watched;
      if (base === p && Math.floor(p.t) === Math.floor(t) && !owed) return p;
      const n = { ...base, t };
      return owed ? updateLesson(n, p.cur, { watched: true }) : n;
    });
  };

  return (
    <div id="lesson-watch" className={clsx("sd-grid @container relative flex flex-none scroll-mt-16 items-center justify-center overflow-hidden rounded-none [--grid:23px] lg:rounded-xl lg:[--grid:32px]", !wide && "py-3 lg:py-6")}>
      {(s.vidErr || errOffline) && (
        <div className="sd-a-in absolute inset-0 z-[3] flex flex-col justify-end gap-2 bg-sd-ink p-4 lg:p-7" style={{ animationDuration: ".3s" }}>
          <span className="flex text-sd-accent-400"><Icon name="alert" className="block size-5 flex-none lg:size-10" /></span>
          <span className="text-xl leading-[1.1] font-extrabold lg:text-[32px]">{errOffline ? "You’re offline" : "This video didn’t load"}</span>
          <span className="max-w-[520px] text-[13px] leading-[1.4] lg:text-[15px]">
            {errOffline ? "Reconnect to keep watching." : `Your place is saved at ${fmt(s.t)}.`}
          </span>
          <div className="mt-1 flex gap-2">
            <button type="button" onClick={() => act((p) => retryVideo(p))} className="sd-btn h-10 border-0 bg-sd-accent-400 text-sd-ink hover:bg-sd-accent-300"><Icon name="rotR" size={16} />Try again</button>
          </div>
        </div>
      )}
      <video
        ref={ref}
        src={voice.wide ?? voice.src}
        poster={poster}
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => act(togglePlay)}
        onLoadedMetadata={(e) => {
          // Also runs after switching voice-over: carry on from the same moment, at the same speed and volume.
          const v = e.currentTarget;
          if (s.t > 0) v.currentTime = s.t;
          Object.assign(v, { playbackRate: s.speed, volume: s.volume, muted: s.muted });
          if (s.playing && v.paused) v.play().catch(() => act((p) => ({ ...p, playing: false })));
        }}
        onTimeUpdate={(e) => onTime(e.currentTarget)}
        onPlay={() => { track("video_play", s.cur, "watch", { at: Math.round(s.t) }); act((p) => (p.playing ? p : { ...p, playing: true })); }}
        onPause={() => act((p) => (p.playing ? { ...p, playing: false } : p))}
        onEnded={() => act((p) => {
          const n = { ...updateLesson(p, p.cur, { watched: true }), playing: false, ended: true };
          // A lesson already passed just ends; otherwise the assessment takes the column.
          return n.lessons[n.cur]?.post ? n : { ...n, stage: "prove" as const, checkStage: checkStageFor(n.lessons[n.cur]) };
        })}
        onError={() => act((p) => ({ ...p, vidErr: true, playing: false }))}
        className={clsx("block cursor-pointer bg-black", wide ? "aspect-video w-full" : "aspect-[9/16] h-[min(68dvh,560px)] max-w-full lg:h-[640px]")}
      />
      {subs && <Subtitles s={s} />}
      {!s.playing && !s.vidErr && !errOffline && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/18">
          <span className="sd-a-pop flex size-16 items-center justify-center rounded-xl bg-sd-accent-400 text-sd-ink shadow-[0_8px_24px_rgba(0,0,0,.35)]"><Icon name="play" size={28} /></span>
        </div>
      )}
      {bar}
    </div>
  );
}

/** The line being spoken, overlaid at the bottom of the video like any player's captions (the clean cut has none burned in). */
function Subtitles({ s }: { s: CourseState }) {
  const cur = lineAt(subtitleLines(s.cur, s.subLang), s.t);
  if (!cur) return null;
  return (
    <div aria-live="off" lang={s.subLang === "en" ? "en" : "hi-Latn"} className="pointer-events-none absolute inset-x-0 bottom-[84px] z-[2] flex justify-center">
      <span className={clsx("max-w-[86%] bg-black/75 px-[0.5em] py-[0.2em] text-center leading-[1.4] font-semibold text-white", SUB_SIZE_CLASS[s.subSize])}>{cur}</span>
    </div>
  );
}

function Notes({ s, act }: { s: CourseState; act: Act }) {
  const notes = [...(s.notes[s.cur] ?? [])].sort((a, b) => a.t - b.t);
  return (
    <div className="flex flex-col gap-3 px-5 py-3.5 lg:p-3.5">
      <div className="flex gap-2">
        <input
          className="sd-input min-h-11"
          value={s.draft}
          aria-label="Note"
          onChange={(e) => act((p) => ({ ...p, draft: e.target.value }))}
          onKeyDown={(e) => { if (e.key === "Enter") act((p) => addNote(p)); }}
          placeholder={`Add a note at ${fmt(s.t)}`}
        />
        <button type="button" onClick={() => act((p) => addNote(p))} disabled={!s.draft.trim()} className="sd-btn sd-btn-primary h-11 flex-none"><Icon name="plus" size={16} />Add</button>
      </div>
      <div className="flex flex-col border-t-2 border-sd-divider lg:border-t-0">
        {notes.map((n, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-sd-divider py-3">
            <button type="button" onClick={() => act((p) => seekTo(p, n.t))} className="sd-tag sd-tag-accent flex-none cursor-pointer font-extrabold">{fmt(n.t)}</button>
            <span className="text-sm leading-[1.4]">{n.text}</span>
          </div>
        ))}
        {!notes.length && <div className="py-3 text-[13px] text-sd-n-700">Notes are pinned to the video time.</div>}
      </div>
    </div>
  );
}

/** Every lesson of the course, by module, with the current one scrolled into view. */
function CourseLessons({ s, act }: { s: CourseState; act: Act }) {
  const here = useRef<HTMLButtonElement>(null);
  useEffect(() => { here.current?.scrollIntoView({ block: "nearest" }); }, []);
  return (
    <div className="flex flex-col px-5 py-3.5 lg:px-3.5 lg:pt-2">
      {MODULES.map((m, mi) => (
        <div key={m.title} className="flex flex-col">
          <h6 className="sd-h6 mt-6 mb-2.5 first:mt-0">{pad(mi + 1)} · {m.title}</h6>
          {moduleIds(mi).map((id) => {
            const v = lessonView(s, id);
            return (
              <button
                key={id}
                ref={v.cur ? here : undefined}
                type="button"
                onClick={() => act((p) => openLesson(p, id))}
                className={clsx("grid cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-2.5 px-2 py-[11px] text-left text-sm scroll-mt-10 hover:bg-sd-accent-100", v.cur && "bg-sd-accent-100")}
              >
                <LessonMark done={v.done} cur={v.cur} locked={v.locked} />
                <span className={clsx("min-w-0", v.cur && "font-extrabold", v.dim && "opacity-45")}>{lessonDay(id)} · {v.title}</span>
                <Duration v={v} time={false} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function Player({ s, act }: { s: CourseState; act: Act }) {
  const c = lesson(s.cur);
  const day = dayOf(s.cur);
  const nextId = ALL_IDS[ALL_IDS.indexOf(s.cur) + 1];
  const qc = hasQuickCheck(s.cur) ? fmt(quickCheckAt(s.cur)) : null;
  const done = flowDone(s, s.cur);
  const completeLabel = nextId ? "Mark complete · next lesson" : "Mark complete";
  const tabs: [PlayerTab, string][] = [
    ["lessons", "Lessons"],
    ["qna", "Q&A"],
    ["notes", `Notes (${(s.notes[s.cur] ?? []).length})`],
  ];
  const shownTabs = day ? tabs : tabs.filter(([v]) => v !== "qna");
  // The video holds the column on the "watch" step, and for lessons with no content yet.
  const watching = !day || s.stage === "watch";
  // The assessment takes the whole column: from the questions on, and while the estimates, build,
  // design and follow-ups are being worked through, the lesson title and the side panel step aside.
  const inAs = s.stage === "prove" && s.checkStage !== "intro";
  const hideChrome = inAs || assessmentStep(s, s.cur) > 0;
  const subsOn = !!day && canSubtitle(s) && s.subs;
  const menu = useMenu();
  usePlayerKeys(act, !!day && !s.qcOpen);

  return (
    <div className="sd-a-screen flex flex-1 max-w-[1200px] flex-col lg:flex-none lg:gap-4">
      <div className="flex items-center gap-2 px-3 pt-1 pb-2.5 lg:p-0">
        <BackButton onClick={() => act((p) => ({ ...p, screen: p.tab, playing: false }))} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.08em] uppercase">{lessonDay(s.cur)} · {c.m.title}</span>
      </div>

      <div className={clsx("flex flex-1 flex-col lg:grid lg:items-start lg:gap-x-8", hideChrome ? "lg:grid-cols-[minmax(0,820px)]" : "lg:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className="flex flex-1 flex-col lg:col-start-1 lg:row-start-1">
          {watching ? (
            <>
              <Video s={s} act={act} subs={subsOn} bar={<VideoBar s={s} act={act} ui={menu} />} />
              <div className="mt-2.5 flex flex-wrap items-center gap-2 px-5 lg:px-0">
                {qc && (
                  <span className="sd-tag sd-tag-neutral gap-1.5 rounded-md">
                    <span className="size-2 rotate-45 border-2 border-sd-accent" />Quick check at {qc}
                  </span>
                )}
                <span className="sd-tag sd-tag-neutral rounded-md">{s.audio} audio</span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col px-5 pt-1 lg:px-0"><LessonStage s={s} act={act} id={s.cur} day={day!} /></div>
          )}
          {!hideChrome && (
            <div className="px-5 lg:px-0">
              <div className="lg:hidden">
                <h3 className="m-0 mt-4 mb-0.5 text-[22px] tracking-[-0.02em]">{c.title}</h3>
              </div>
              <div className="mt-5 hidden flex-wrap items-end justify-between gap-4 border-t-2 border-sd-divider pt-4 lg:flex">
                <h2 className="m-0 text-[30px] tracking-[-0.02em]">{c.title}</h2>
                {done && <button type="button" onClick={() => act((p) => completeNext(p, false))} className="sd-btn sd-btn-primary h-11 gap-2"><Icon name="check" size={16} />{completeLabel}</button>}
              </div>
            </div>
          )}
        </div>

        {!hideChrome && <div data-tour="tabs" className="mt-4 flex flex-col lg:col-start-2 lg:row-start-1 lg:mt-0 lg:overflow-hidden lg:rounded-xl lg:border-2 lg:border-sd-divider">
          <div role="tablist" aria-label="Lesson panel" className="mx-5 grid gap-0.5 rounded-xl bg-[#ebe5db] p-1 shadow-[inset_0_1px_2px_rgba(32,30,29,.08)] lg:mx-0" style={{ gridTemplateColumns: `repeat(${shownTabs.length}, minmax(0, 1fr))` }}>
            {shownTabs.map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={s.ptab === v}
                onClick={() => act((p) => ({ ...p, ptab: v }))}
                className={clsx(
                  "h-9 cursor-pointer overflow-hidden rounded-[9px] px-1 text-[13px] text-ellipsis whitespace-nowrap transition-colors duration-200",
                  s.ptab === v ? "bg-[#fffdf9] font-extrabold text-sd-ink shadow-[0_1px_2px_rgba(32,30,29,.12),0_2px_8px_-2px_rgba(32,30,29,.12)]" : "font-semibold text-sd-n-700 hover:text-sd-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* One height for every tab, so switching never changes the page's length and the tabs stay where they are. */}
          <div className="h-[440px] overflow-y-auto overscroll-contain lg:h-[560px]">
            {s.ptab === "lessons" && <CourseLessons s={s} act={act} />}
            {s.ptab === "qna" && day && <Community key={s.cur} lesson={s.cur} day={day} lang={s.lang} />}
            {s.ptab === "notes" && <Notes s={s} act={act} />}
          </div>
        </div>}

      </div>

      {done && (
        <div className="sticky bottom-0 mt-auto border-t-2 border-sd-divider bg-sd-bg px-5 pt-2 pb-4 lg:hidden">
          <button type="button" onClick={() => act((p) => completeNext(p, false))} className="sd-btn sd-btn-primary sd-btn-block h-12"><Icon name="check" size={16} />{completeLabel}</button>
        </div>
      )}
      {day && !s.toured && <Tour s={s} act={act} />}
    </div>
  );
}
