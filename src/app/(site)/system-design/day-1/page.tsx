import { redirect } from "next/navigation";

/** Every lesson is in the full course: this old link goes to the offer. */
export default function SystemDesignDayOne() {
  redirect("/system-design");
}
