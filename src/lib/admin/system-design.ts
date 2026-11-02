import "server-only";
import { LESSON_DAYS } from "@/data/system-design/lessons";
import { getAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db/client";
import { summarise, type SdEventRow, type SdFeedbackRow, type SdSummary } from "@/lib/sd-summary";

const PAGE = 1000;
const MAX_PAGES = 40;

export type SdAnalytics = (SdSummary & { ok: true }) | { ok: false; reason: "no-db" | "no-table" };

/** System Design course activity for the last `days` days (newest 40k events at most). */
export async function getSdAnalytics(days: number): Promise<SdAnalytics> {
  if (!(await getAdmin())) return { ok: false, reason: "no-db" };
  const sql = db();
  if (!sql) return { ok: false, reason: "no-db" };
  const since = new Date(Date.now() - days * 864e5).toISOString();

  const events: SdEventRow[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await sql.rows<SdEventRow>`
      select created_at, anon_id, email, event, lesson, step, props, lang, device
        from course.sd_events
       where created_at >= ${since}
       order by created_at
       limit ${PAGE} offset ${page * PAGE}
    `;
    if (error) return { ok: false, reason: "no-table" };
    events.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  const { data: feedback } = await sql.rows<SdFeedbackRow>`
    select created_at, anon_id, email, lesson, rating, clarity, will_finish, improve, lang
      from course.sd_feedback
     where created_at >= ${since}
     order by created_at desc
  `;
  return { ok: true, ...summarise(events, feedback ?? [], LESSON_DAYS) };
}

/** Everything one learner did, oldest first. */
export async function getSdLearner(anon: string): Promise<SdEventRow[]> {
  if (!(await getAdmin()) || !/^[a-zA-Z0-9-]{8,64}$/.test(anon)) return [];
  const sql = db();
  if (!sql) return [];
  const { data } = await sql.rows<SdEventRow>`
    select created_at, anon_id, email, event, lesson, step, props, lang, device
      from course.sd_events
     where anon_id = ${anon}
     order by created_at
     limit 1000
  `;
  return data ?? [];
}
