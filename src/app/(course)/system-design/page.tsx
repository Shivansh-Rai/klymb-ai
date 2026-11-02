import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, verifiedEmailFrom } from "@/auth";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { OfferView } from "@/components/system-design-offer/OfferView";
import { hasCourseAccess } from "@/lib/access";
import { db } from "@/lib/db/client";
import { SD_COURSE, campaignOf, inAppBrowser, sdOfferState, type SdRole } from "@/lib/sd-offer";

const title = "System Design · Early Diwali offer";
const description = "System design, explained with real examples. Built for interviews.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
  twitter: { title, description },
};

export const viewport: Viewport = { themeColor: "#1a1716" };

/**
 * The offer. Anyone can read it. Tapping Claim is what signs them in with
 * Google, which is where the email comes from, and `?claim=1` is the return
 * from that trip: the form picks up where it left off and goes on to Razorpay.
 */
export default async function SystemDesignOfferPage({ searchParams }: { searchParams: Promise<{ utm_campaign?: string; signin?: string; claim?: string }> }) {
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
        resume={params.claim === "1"}
        signInFailed={params.signin === "failed"}
        inApp={inAppBrowser((await headers()).get("user-agent") ?? "")}
      />
      <CookieBanner />
    </>
  );
}
