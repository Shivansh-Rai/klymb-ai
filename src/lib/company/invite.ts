import "server-only";
import { site } from "@/data/config";
import { grievance } from "@/data/legal";
import type { CompanyBrand } from "@/lib/company/brand";
import type { Db } from "@/lib/db/client";
import { companyInviteEmail, sendMail } from "@/lib/mail";

/**
 * The "you've been added" email for a company member, in the company's look,
 * with the way to sign in. Used by Klymb admin (first HR person) and by HR
 * (People page, including Resend). Never throws: adding the person has
 * already worked, the email is a courtesy.
 */
export async function sendCompanyInvite(p: { email: string; name: string | null; company: CompanyBrand; role: "hr" | "employee"; resend?: boolean }) {
  const { fromName, ...mail } = companyInviteEmail({ ...p, siteUrl: site.url, supportEmail: grievance.email });
  try {
    // No idempotency key: Resend is meant to send the email again.
    const sent = await sendMail({ to: { email: p.email, ...(p.name ? { name: p.name } : {}) }, fromName, ...mail, kind: "company.invite" });
    if (!sent.ok) console.error("company invite email failed:", sent.reason);
    return sent.ok;
  } catch (e) {
    console.error("company invite email failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** The name, logo and color an invite is sent with. Null when the company can't be read. */
export async function loadCompanyBrand(sql: Db, companyId: string): Promise<CompanyBrand | null> {
  const { data, error } = await sql.row<{ name: string; logo_url: string | null; brand_color: string | null }>`
    select name, logo_url, brand_color from course.companies where id = ${companyId}::uuid
  `;
  if (error || !data) return null;
  return { name: data.name, logoUrl: data.logo_url, brandColor: data.brand_color };
}
