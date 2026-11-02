import { redirect } from "next/navigation";

/** The old free Day 0 page. The course now starts at Day 1, inside the app. */
export default function SystemDesignDayZero() {
  redirect("/learn/system-design");
}
