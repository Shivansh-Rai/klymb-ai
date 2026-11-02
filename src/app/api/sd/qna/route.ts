import { NextResponse } from "next/server";
import { auth, verifiedEmailFrom } from "@/auth";
import { BUILT_LESSONS } from "@/data/system-design/course-app";
import { getAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { QNA_PAGE, cleanBody, displayName, isUuid, toFeed, type QnaFeed, type QnaRow } from "@/lib/sd-qna";

const lessonOf = (v: unknown) => (typeof v === "string" && BUILT_LESSONS.includes(v) ? v : null);

/**
 * A lesson's Q&A: questions from learners, replies from learners and the
 * Klymb team.
 *
 * Anyone can read; posting needs a verified Google sign-in, so every post has
 * a person behind it. Who is staff is read from admin_users on each request,
 * never from the body. Emails stay on the server: the feed says only whether
 * a post is the viewer's own.
 */
export async function GET(req: Request) {
  const lesson = lessonOf(new URL(req.url).searchParams.get("lesson"));
  if (!lesson) return NextResponse.json({ error: "Unknown lesson." }, { status: 400 });

  const sql = db();
  if (!sql) return NextResponse.json({ error: "Q&A is not available right now." }, { status: 503 });

  const viewer = verifiedEmailFrom(await auth());
  const admin = viewer ? !!(await getAdmin()) : false;

  // The newest page of questions, and every reply under them.
  const { data, error } = await sql.rows<QnaRow>`
    with q as (
      select id, created_at, parent_id, email, name, staff, body from course.sd_qna
       where lesson = ${lesson} and parent_id is null and hidden_at is null
       order by created_at desc
       limit ${QNA_PAGE}
    )
    select * from q
    union all
    select r.id, r.created_at, r.parent_id, r.email, r.name, r.staff, r.body
      from course.sd_qna r join q on r.parent_id = q.id
     where r.hidden_at is null
  `;
  if (error) {
    console.error("sd qna read failed:", error.message);
    return NextResponse.json({ error: "Couldn't load questions." }, { status: 500 });
  }

  const feed: QnaFeed = { questions: toFeed(data ?? [], viewer), canPost: !!viewer, admin };
  return NextResponse.json(feed, { headers: { "cache-control": "no-store" } });
}

/** A new question (no parent) or a reply to one. */
export async function POST(req: Request) {
  const session = await auth();
  const email = verifiedEmailFrom(session);
  if (!email) return NextResponse.json({ error: "Sign in to post." }, { status: 401 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const lesson = lessonOf(b?.lesson);
  const body = cleanBody(b?.body);
  const parent = b?.parent == null ? null : isUuid(b.parent) ? b.parent : undefined;
  if (!lesson || !body || parent === undefined) return NextResponse.json({ error: "Write something first." }, { status: 400 });

  const admin = await getAdmin();
  if (!admin) {
    // A chat, not a firehose: generous for a learner, and a stop for a loop.
    const limit = await checkRateLimit("sd-qna", { limit: 20, windowMinutes: 60, identity: email });
    if (!limit.allowed) return NextResponse.json({ error: "That's a lot of posts. Take a break and come back in a bit." }, { status: 429 });
  }

  const sql = db();
  if (!sql) return NextResponse.json({ error: "Couldn't post right now." }, { status: 503 });

  if (parent) {
    // Replies go on a live question in the same lesson, one level deep.
    const { data: q } = await sql.row<{ id: string }>`
      select id from course.sd_qna
       where id = ${parent} and lesson = ${lesson} and parent_id is null and hidden_at is null
    `;
    if (!q) return NextResponse.json({ error: "That question is no longer here." }, { status: 404 });
  }

  const name = displayName(admin?.name ?? session?.user?.name, email);
  const { error } = await sql.run`
    insert into course.sd_qna (lesson, parent_id, email, name, staff, body)
    values (${lesson}, ${parent}, ${email}, ${name}, ${!!admin}, ${body})
  `;
  if (error) {
    console.error("sd qna post failed:", error.message);
    return NextResponse.json({ error: "Couldn't post right now. Try again in a minute." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Take a post down: your own, or anyone's if you are an admin. Its replies go with it. */
export async function DELETE(req: Request) {
  const email = verifiedEmailFrom(await auth());
  if (!email) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!isUuid(id)) return NextResponse.json({ error: "Which post?" }, { status: 400 });

  const sql = db();
  if (!sql) return NextResponse.json({ error: "Couldn't remove that right now." }, { status: 503 });
  const admin = !!(await getAdmin());

  const { data, error } = await sql.rows<{ id: string }>`
    update course.sd_qna set hidden_at = now(), hidden_by = ${email}
     where hidden_at is null and (id = ${id} or parent_id = ${id})
       and (${admin} or exists (select 1 from course.sd_qna p where p.id = ${id} and p.email = ${email}))
    returning id
  `;
  if (error) return NextResponse.json({ error: "Couldn't remove that right now." }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "That isn't yours to remove." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
