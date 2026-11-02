/**
 * Plain-English lines for one learner's System Design trail, so an admin can
 * read it like a story instead of decoding event names.
 */

type Props = Record<string, unknown>;
export interface TrailEvent { event: string; lesson: string | null; step: string | null; props: Props | null; created_at: string }
export type Tone = "learn" | "win" | "miss" | "nav" | "setting";
export interface TrailLine { at: string; until?: string; lesson: string | null; text: string; detail?: string; tone: Tone }

const SCREENS: Record<string, string> = {
  splash: "Opened the course app",
  onboard: "Saw the intro slides",
  commit: "Saw the “commit to 21 days” screen",
  home: "Went to Home",
  course: "Browsed the list of days",
  progress: "Checked their progress",
  refer: "Opened the Refer tab",
  profile: "Opened their profile",
  notifs: "Opened notifications",
  player: "Opened the lesson",
  quiz: "Started the lesson check",
  results: "Saw their check results",
  recap: "Saw the day’s recap",
};

const STEPS: Record<string, string> = {
  watched: "Finished watching the video",
  read: "Read the story instead of watching",
  est: "Did the estimation exercise",
  built: "Built the diagram",
  drawn: "Drew the design from scratch",
  design: "Wrote their own design",
  checks: "Ticked the design self-check",
  follow: "Answered the interviewer follow-ups",
};

const secs = (t: unknown) => {
  const n = Number(t) || 0;
  return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, "0")}s`;
};

function describe(e: TrailEvent): Omit<TrailLine, "at" | "lesson"> {
  const p = e.props ?? {};
  switch (e.event) {
    case "screen": return { text: SCREENS[String(p.screen)] ?? `Opened ${p.screen}`, tone: "nav" };
    case "lesson_open": return { text: "Started the lesson", tone: "learn" };
    case "video_play": return e.lesson === "overview"
      ? { text: "Played the course trailer", tone: "learn" }
      : { text: "Pressed play", detail: p.at ? `from ${secs(p.at)}` : undefined, tone: "learn" };
    case "video_progress": return { text: e.lesson === "overview" ? `Watched ${p.pct}% of the trailer` : `Watched ${p.pct}% of the video`, tone: "learn" };
    case "signin": return { text: "Signed in with Google", tone: "win" };
    case "welcome": return { text: p.choice === "commit" ? "Committed to the 21 days (held the button)" : "Chose to jump straight into Day 1", tone: "win" };
    case "tour": return p.action === "finished"
      ? { text: "Finished the quick tour of the lesson screen", tone: "nav" }
      : { text: `Skipped the tour at tip ${p.at}`, tone: "nav" };
    case "day_complete": return { text: "Completed the day 🎉", tone: "win" };
    case "share": return { text: p.kind === "image" ? "Downloaded the share image" : "Shared on LinkedIn", tone: "win" };
    case "lang": return { text: `Switched lesson language to ${p.lang === "hi" ? "Hinglish" : "English"}`, tone: "setting" };
    case "subs": return { text: p.on ? `Turned subtitles on${p.lang ? ` (${p.lang === "hi" ? "Hinglish" : "English"})` : ""}` : "Turned subtitles off", tone: "setting" };
    case "takeover": return { text: "Continued on this device (another device was signed out)", tone: "setting" };
    case "step_done": {
      if (e.step === "check" || e.step === "post") {
        const score = p.pct !== undefined ? `${p.pct}%` : `${p.score}/${p.of} right`;
        if (e.step === "post") return { text: "Passed the lesson check", detail: score, tone: "win" };
        return p.passed
          ? { text: `Passed the lesson check${Number(p.try) > 1 ? ` on try ${p.try}` : ""}`, detail: score, tone: "win" }
          : { text: `Missed the lesson check (try ${p.try})`, detail: `${score}, needs 60%`, tone: "miss" };
      }
      const detail =
        e.step === "est" ? `${p.inRange} of ${p.of} numbers close enough` :
        e.step === "built" ? (Number(p.wrong) ? `${p.wrong} wrong drops on the way` : "no wrong drops") :
        e.step === "drawn" ? `${p.score} of ${p.of} connections right` :
        e.step === "design" ? `${p.chars} characters` :
        e.step === "checks" ? `${p.ticked} of ${p.of} points covered` :
        e.step === "follow" ? `knew ${p.covered} of ${p.of}` : undefined;
      return { text: STEPS[e.step ?? ""] ?? `Finished ${e.step}`, detail, tone: "learn" };
    }
    default: {
      const rest = Object.entries(p).map(([k, v]) => `${k}: ${v}`).join(", ");
      return { text: e.event.replaceAll("_", " "), detail: rest || undefined, tone: "nav" };
    }
  }
}

/**
 * The trail as readable lines. Heartbeat pings (sent every few seconds while
 * the lesson is open) are folded into one "spent time" line per stretch, and
 * the "Opened the lesson" screen line is dropped next to "Started the lesson".
 */
export function trailLines(events: TrailEvent[]): TrailLine[] {
  const out: TrailLine[] = [];
  let run: { first: TrailEvent; last: TrailEvent; maxT: number; playing: boolean } | null = null;
  const flush = () => {
    if (!run) return;
    const mins = Math.round((Date.parse(run.last.created_at) - Date.parse(run.first.created_at)) / 60000);
    out.push({
      at: run.first.created_at, until: run.last.created_at, lesson: run.first.lesson, tone: "learn",
      text: mins >= 1 ? `Spent about ${mins} min in the lesson` : "Was in the lesson",
      detail: run.playing ? `video reached ${secs(run.maxT)}` : `video not playing${run.maxT ? `, paused at ${secs(run.maxT)}` : ""}`,
    });
    run = null;
  };
  for (const e of events) {
    if (e.event === "ping") {
      const t = Number(e.props?.t) || 0;
      const playing = !!e.props?.playing;
      if (run && run.first.lesson === e.lesson) { run.last = e; run.maxT = Math.max(run.maxT, t); run.playing ||= playing; }
      else { flush(); run = { first: e, last: e, maxT: t, playing }; }
      continue;
    }
    flush();
    if (e.event === "screen" && e.props?.screen === "player") continue;
    out.push({ at: e.created_at, lesson: e.lesson, ...describe(e) });
  }
  flush();
  return out;
}
