"use client";

import clsx from "clsx";
import { createContext, useContext } from "react";
import { courseSignIn, courseSignOut } from "@/app/(course)/learn/system-design/actions";
import { GoogleMark } from "@/components/ui/GoogleMark";
import { track } from "./track";

/** Who is signed in, if anyone: read on the server and handed to the course. */
export interface CourseUser { name: string | null; email: string }

const Ctx = createContext<CourseUser | null>(null);
export const CourseUserProvider = Ctx.Provider;
export const useCourseUser = () => useContext(Ctx);
export const firstName = (u: CourseUser | null) => u?.name?.trim().split(/\s+/)[0] ?? null;

/** "Continue with Google", returning to `lesson` after sign-in. */
export function GoogleButton({ lesson, where, label = "Continue with Google", className }: { lesson?: string; where: string; label?: string; className?: string }) {
  return (
    <form action={courseSignIn} onSubmit={() => track("signin", lesson ?? null, null, { where })}>
      <input type="hidden" name="lesson" value={lesson ?? ""} />
      <button type="submit" className={clsx("sd-btn sd-btn-secondary w-full gap-3 bg-white", className)}>
        <GoogleMark />{label}
      </button>
    </form>
  );
}

/** Logs out. Lesson passes stay on the account; what this device keeps stays here. */
export function LogOutButton() {
  return (
    <form action={courseSignOut}>
      <button type="submit" className="sd-btn sd-btn-secondary w-full bg-white">Log out</button>
    </form>
  );
}
