import { redirect } from "next/navigation";

/** Pre-registration has closed: this link now goes to the offer. */
export default function SystemDesignRegisterPage() {
  redirect("/system-design");
}
