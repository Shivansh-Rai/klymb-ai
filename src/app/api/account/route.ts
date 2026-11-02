import { NextResponse } from "next/server";
import { currentEmail } from "@/auth";
import { hasCourseAccess } from "@/lib/access";
import { SD_COURSE } from "@/lib/sd-offer";

export const dynamic = "force-dynamic";

/**
 * Where the header's account link goes, so public pages can show it without
 * rendering per user. Null for visitors. Never carries the email itself.
 */
export async function GET() {
  const email = await currentEmail();
  const link = !email ? null
    : (await hasCourseAccess(email, SD_COURSE)) ? { label: "My course", href: "/learn/system-design" }
    : { label: "My dashboard", href: "/learn" };
  return NextResponse.json({ link }, { headers: { "Cache-Control": "private, no-store" } });
}
