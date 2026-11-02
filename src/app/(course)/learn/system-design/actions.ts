"use server";

import { signIn } from "@/auth";
import { BUILT_LESSONS } from "@/data/system-design/course-app";

/** Google sign-in from the System Design course; it comes back to the lesson the learner was on. */
export async function courseSignIn(form: FormData) {
  const lesson = String(form.get("lesson") ?? "");
  const to = BUILT_LESSONS.includes(lesson) ? `/learn/system-design?lesson=${lesson}` : "/learn/system-design";
  await signIn("google", { redirectTo: to });
}
