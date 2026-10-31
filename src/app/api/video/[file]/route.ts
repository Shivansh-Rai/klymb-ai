import { currentEmail } from "@/auth";
import { hasCourseAccess } from "@/lib/access";
import { signedLink } from "@/lib/r2";
import { isFreeVideo } from "@/lib/sd-lessons";
import { SD_COURSE } from "@/lib/sd-offer";

export const dynamic = "force-dynamic";

/** Only the course's own video files, by name: nothing else in the bucket. */
const FILE = /^[a-z0-9-]+\.mp4$/;

/**
 * Plays a System Design video: redirects to a fresh signed R2 link. The
 * overview is open to everyone; every lesson needs a seat. Without
 * R2 keys (local dev) the free videos fall back to their copies in public/,
 * which hold no paid lesson.
 */
export async function GET(_req: Request, { params }: RouteContext<"/api/video/[file]">) {
  const { file } = await params;
  if (!FILE.test(file)) return new Response("Not found", { status: 404 });
  if (!isFreeVideo(file)) {
    const email = await currentEmail();
    if (!email || !(await hasCourseAccess(email, SD_COURSE))) return new Response("This lesson is in the full course.", { status: 403 });
  }
  const url = (await signedLink(`system-design/${file}`)) ?? `/videos/system-design/${file}`;
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
}
