"use server";

import { auth, signIn, signOut } from "@/auth";
import { BUILT_LESSONS } from "@/data/system-design/course-app";
import { normaliseEmail } from "@/lib/email";
import { releaseDevice } from "@/lib/learner/device";

/** Google sign-in from the System Design course; it comes back to the lesson the learner was on. */
export async function courseSignIn(form: FormData) {
  const lesson = String(form.get("lesson") ?? "");
  const to = BUILT_LESSONS.includes(lesson) ? `/learn/system-design?lesson=${lesson}` : "/learn/system-design";
  await signIn("google", { redirectTo: to });
}

/** Logs out of the course, freeing this device's slot, and lands on the public offer page. */
export async function courseSignOut() {
  const session = await auth();
  const email = normaliseEmail(session?.user?.email);
  if (email) await releaseDevice(email, session?.user?.sid);
  await signOut({ redirectTo: "/system-design" });
}
