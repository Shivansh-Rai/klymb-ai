"use server";

import { signIn, signOut } from "@/auth";
import { campaignOf, offerPath } from "@/lib/sd-offer";

/** Tapping Claim while signed out. Google gives us the email, and they come back to finish the claim. */
export async function offerSignIn(form: FormData) {
  await signIn("google", { redirectTo: offerPath(campaignOf(form.get("campaign")), true) });
}

/** "Use a different account": drop this Google session and return to the offer. */
export async function offerSwitchAccount(form: FormData) {
  await signOut({ redirectTo: offerPath(campaignOf(form.get("campaign"))) });
}
