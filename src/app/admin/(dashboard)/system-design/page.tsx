import Link from "next/link";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageTitle } from "@/components/admin/PageTitle";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { StatTile } from "@/components/admin/StatTile";
import { BarList } from "@/components/charts/BarList";
import { rangeDays, RANGES } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/auth";
import { lessonDay } from "@/lib/course-app";
import { getSdAnalytics, getSdLearner } from "@/lib/admin/system-design";
import { trailLines, type Tone } from "@/lib/admin/sd-event-words";
import { Chip, DayView, Panel, PlainWords, pct } from "@/components/admin/SystemDesignViews";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const dayName = (lesson: string | null) => (lesson && /^\d+-\d+$/.test(lesson) ? lessonDay(lesson) : lesson ?? "");

const TONE: Record<Tone, string> = { learn: "bg-sky-500", win: "bg-emerald-500", miss: "bg-red-500", nav: "bg-line", setting: "bg-amber-500" };

/** One learner's whole trail through the course, oldest first. */
async function LearnerTrail({ anon }: { anon: string }) {
  const events = await getSdLearner(anon);
  const who = events.find((e) => e.email)?.email ?? `Anonymous ${anon.slice(0, 8)}`;
  return (
    <>
      <PageTitle eyebrow="System Design · one learner" title={who} intro="Everything they did, oldest first. Green = a win, red = a miss, blue = learning, grey = moving around. Times are IST." actions={<Link href="/admin/system-design" className="rounded-lg border border-line/50 px-3 py-1.5 text-xs font-bold hover:bg-ink hover:text-paper">Back to all learners</Link>} />
      {!events.length ? (
        <EmptyState title="Nothing recorded" body="This learner has no activity in the course." />
      ) : (
        <ol className="card divide-y divide-line/25 overflow-hidden">
          {trailLines(events).map((l, i) => (
            <li key={i} className="grid grid-cols-[150px_70px_1fr] items-baseline gap-3 px-5 py-2.5 text-sm max-sm:grid-cols-[1fr_auto]">
              <span className="text-muted">{when(l.at)}{l.until && when(l.until) !== when(l.at) ? ` – ${when(l.until).split(", ").pop()}` : ""}</span>
              <span className="font-bold">{dayName(l.lesson === "overview" ? null : l.lesson)}</span>
              <span className="flex items-baseline gap-2 max-sm:col-span-2">
                <span aria-hidden className={`size-2 shrink-0 translate-y-[-1px] rounded-full ${TONE[l.tone]}`} />
                <span><span className={l.tone === "nav" ? "text-muted" : "font-semibold"}>{l.text}</span>{l.detail && <span className="text-muted"> · {l.detail}</span>}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export default async function AdminSystemDesignPage({ searchParams }: { searchParams: Promise<{ range?: string; learner?: string; day?: string }> }) {
  await requireAdmin();
  const { range, learner, day } = await searchParams;
  if (learner) return <LearnerTrail anon={learner} />;

  const days = rangeDays(range);
  const data = await getSdAnalytics(days);
  const title = (
    <PageTitle
      eyebrow="Course activity"
      title="System Design"
      intro="Who is taking the course, how far they get, which questions trip them up, and what they tell us."
      actions={<RangeTabs param="range" current={range ?? "30d"} options={RANGES.map((r) => ({ key: r.key, label: r.label }))} />}
    />
  );

  if (!data.ok) {
    return (
      <>
        {title}
        <EmptyState
          title={data.reason === "no-table" ? "Activity tables aren't set up yet" : "Database not connected"}
          body={data.reason === "no-table" ? "Run supabase/migrations/20261023000000_system_design_activity.sql in the Supabase SQL editor once. Activity starts recording right after." : "Supabase isn't configured for this environment."}
        />
      </>
    );
  }
  const t = data.totals;
  const lesson = data.lessons.find((l) => l.id === day) ?? data.lessons[0];

  return (
    <>
      {title}
      <PlainWords data={data} days={days} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Opened the course" value={t.visitors} hint={`Last ${days} days`} />
        <StatTile label="Started a day" value={t.started} hint={`${pct(t.started, t.visitors)} of them`} />
        <StatTile label="Finished a day" value={t.completedAny} hint={`${pct(t.completedAny, t.started)} of starters`} tone="red" />
        <StatTile label="Signed in" value={t.signedIn} hint="Known by email" />
        <StatTile label="Rating" value={t.avgRating ?? "–"} hint={`${t.feedback} ${t.feedback === 1 ? "response" : "responses"}`} />
      </div>

      <div className="mt-8">
        <Panel title="Who’s taking the course" note="Most recent first. Click a name to see everything they did, step by step.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.1em] text-muted"><tr><th className="py-2 pr-3">Learner</th><th className="py-2 pr-3">Right now</th><th className="py-2 pr-3">Finished</th><th className="py-2 pr-3">Time spent</th><th className="py-2 pr-3">On</th><th className="py-2">Last seen</th></tr></thead>
              <tbody className="divide-y divide-line/25">
                {data.learners.slice(0, 200).map((l) => (
                  <tr key={l.anon}>
                    <td className="py-2.5 pr-3"><Link className="font-bold underline underline-offset-4" href={`/admin/system-design?learner=${l.anon}`}>{l.email ?? `Anonymous ${l.anon.slice(0, 8)}`}</Link></td>
                    <td className="py-2.5 pr-3">{l.where === "Browsing" ? <span className="text-muted">Just looking around</span> : l.where}</td>
                    <td className="py-2.5 pr-3">{l.done.length ? l.done.map((d) => <Chip key={d} tone="ok">{dayName(d)}</Chip>) : <span className="text-muted">–</span>}</td>
                    <td className="nums py-2.5 pr-3">{l.minutes ? `${l.minutes} min` : <span className="text-muted">under a minute</span>}</td>
                    <td className="py-2.5 pr-3">{l.device === "phone" ? "Phone" : l.device === "desktop" ? "Laptop" : "–"}{l.lang ? ` · ${l.lang === "hi" ? "Hinglish" : "English"}` : ""}</td>
                    <td className="py-2.5 text-muted">{when(l.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.learners.length && <p className="py-6 text-center text-sm text-muted">No activity yet in this window.</p>}
          </div>
        </Panel>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-3xl">Day {lesson.day} · {lesson.app}</h2>
        <RangeTabs param="day" current={lesson.id} options={data.lessons.map((l) => ({ key: l.id, label: `Day ${l.day}` }))} />
      </div>
      <div className="mt-4"><DayView l={lesson} /></div>

      <div className="mt-10">
        <Panel title="What learners said" note="Their answer to “What should we improve?”, newest first.">
          {data.comments.length ? (
            <ul className="divide-y divide-line/25">
              {data.comments.map((c, i) => (
                <li key={i} className="py-3 text-sm">
                  <p className="whitespace-pre-wrap text-[15px]">“{c.improve}”</p>
                  <p className="mt-1 text-xs text-muted">{dayName(c.lesson)} · {c.rating}★ · {c.email ?? "anonymous"} · {when(c.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No comments yet.</p>}
        </Panel>
      </div>

      <details className="group mt-10">
        <summary className="cursor-pointer list-none text-sm font-bold underline underline-offset-4 [&::-webkit-details-marker]:hidden">More detail: language, device, screens, welcome, tour and sign-ins</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <Panel title="Language"><BarList rows={data.lang} unit="people" /></Panel>
          <Panel title="Device"><BarList rows={data.device} unit="people" /></Panel>
          <Panel title="Screens they open"><BarList rows={data.screens} unit="views" /></Panel>
          <Panel title="Welcome screen"><BarList rows={data.welcome} unit="people" /></Panel>
          <Panel title="Kamran’s tour"><BarList rows={data.tour} unit="people" /></Panel>
          <Panel title="Google sign-in clicks"><BarList rows={data.signins} unit="clicks" emptyLabel="No sign-in clicks yet." /></Panel>
          <Panel title="Other"><ul className="flex flex-col gap-2 text-sm"><li>Turned subtitles off: <b>{data.subsOff}</b></li><li>LinkedIn shares and image downloads: <b>{data.shares}</b></li></ul></Panel>
        </div>
      </details>
    </>
  );
}
