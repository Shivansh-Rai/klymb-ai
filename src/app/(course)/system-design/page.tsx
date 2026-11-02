import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, verifiedEmailFrom } from "@/auth";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { OfferView } from "@/components/system-design-offer/OfferView";
import { hasCourseAccess } from "@/lib/access";
import { db } from "@/lib/db/client";
import { inviterFor } from "@/lib/referrals";
import { SD_COURSE, campaignOf, inAppBrowser, refOf, sdOfferOpen, sdOfferState, type SdRole } from "@/lib/sd-offer";

const description = "System design, explained with real examples. Built for interviews.";

type Params = { utm_campaign?: string; signin?: string; claim?: string; ref?: string };

/** Who sent this link. The preview and the page both ask, so it's one query. */
const invitedByOf = cache(async (ref: string | null) => (ref ? inviterFor(ref) : null));

/** What a shared link says before it's opened: who sent it, and the sale only while it runs. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const invitedBy = await invitedByOf(refOf((await searchParams).ref));
  const title = invitedBy ? `${invitedBy} invited you to System Design` : sdOfferOpen() ? "System Design · Early Diwali offer" : "System Design";
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}

export const viewport: Viewport = { themeColor: "#1a1716" };

/**
 * The offer. Anyone can read it. Tapping Claim is what signs them in with
 * Google, which is where the email comes from, and `?claim=1` is the return
 * from that trip: the form picks up where it left off and goes on to Razorpay.
 */
export default async function SystemDesignOfferPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const session = await auth();
  const email = verifiedEmailFrom(session);

  if (email && (await hasCourseAccess(email, SD_COURSE))) redirect("/learn/system-design");

  const sql = db();
  const lead = email && sql
    ? (await sql.row<{ name: string; phone: string; linkedin: string | null; status: SdRole; locked_price: number }>`
        select name, phone, linkedin, status, locked_price from course.sd_preregistrations where email = ${email}
      `).data
    : null;

  // A code that leads nobody isn't kept, so the form never shows a dead one.
  const ref = refOf(params.ref);
  const invitedBy = await invitedByOf(ref);

  return (
    <>
      <OfferView
        offer={sdOfferState(lead?.locked_price)}
        email={email}
        name={lead?.name ?? session?.user?.name ?? ""}
        phone={lead?.phone.replace(/\D/g, "").slice(-10) ?? ""}
        linkedin={lead?.linkedin ?? ""}
        role={lead?.status ?? ""}
        campaign={campaignOf(params.utm_campaign)}
        referral={invitedBy ? { code: ref!, invitedBy } : null}
        resume={params.claim === "1"}
        signInFailed={params.signin === "failed"}
        inApp={inAppBrowser((await headers()).get("user-agent") ?? "")}
      />
      <CookieBanner />
    </>
  );
}
