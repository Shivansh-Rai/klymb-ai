import type { Metadata, Viewport } from "next";
import { auth, verifiedEmailFrom } from "@/auth";
import { CourseApp } from "@/components/course-app/CourseApp";
import { hasCourseAccess } from "@/lib/access";
import { lessonContent } from "@/lib/sd-lessons";
import { SD_COURSE } from "@/lib/sd-offer";

export const metadata: Metadata = {
  title: "System Design course",
  description: "Short video lessons, in-video quick checks, and a pre- and post-assessment that show what you learned.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f3f2f2", viewportFit: "cover" };

export default async function SystemDesignCoursePage() {
  const session = await auth();
  const email = verifiedEmailFrom(session);
  const enrolled = !!email && (await hasCourseAccess(email, SD_COURSE));
  return <CourseApp user={email ? { email, name: session?.user?.name ?? null } : null} lessons={lessonContent(enrolled)} enrolled={enrolled} />;
}
