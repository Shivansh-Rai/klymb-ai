import { BUILT_LESSONS, MODULES } from "@/data/system-design/course-app";
import { SD_REFERRAL } from "@/lib/sd-offer";

const LESSON_TOTAL = MODULES.reduce((n, m) => n + m.lessons.length, 0);

/**
 * ─────────────────────────────────────────────────────────────
 *  ENTITY, GRIEVANCE AND POLICY DETAILS
 * ─────────────────────────────────────────────────────────────
 *
 * The legal identification India's Digital Personal Data Protection Act 2023,
 * the IT Rules 2021 and the Consumer Protection (E-Commerce) Rules 2020 require
 * a seller to publish. Klymb.ai is a brand of Creators Enterprises Private
 * Limited, which also holds the account payments settle to: the seller named
 * here must be the entity that receives the money.
 *
 * CIN, incorporation date, registered office and directors are from the
 * company's public MCA record (looked up 26 September 2026).
 *
 * ⚠️ `confirm` marks what should be checked against the Certificate of
 * Incorporation, or decided by the company, before the first payment.
 */

export const entity = {
  brand: "Klymb.ai",
  registeredName: "Creators Enterprises Private Limited",
  entityType: "Private Limited Company",
  cin: "U72900UP2016PTC086187",
  incorporationDate: "06 September 2016",
  registrar: "Registrar of Companies, Kanpur",
  directors: ["Tarun Kumar Singh", "Gayatri Singh"],
  /** confirm: exactly as printed on the Certificate of Incorporation. */
  address: "1605, Tower 3, Panchsheel Wellington, Crossing Republik, Ghaziabad, Uttar Pradesh 201016, India",
  /** confirm: add the GSTIN here once registered; it is shown wherever it is set. */
  gstin: null as string | null,
} as const;

/** The same facts on every legal page, in one order, so they cannot drift apart. */
export const entityRows: [string, string][] = [
  ["Brand", entity.brand],
  ["Registered entity", entity.registeredName],
  ["Entity type", entity.entityType],
  ["Corporate Identification Number (CIN)", entity.cin],
  ["Date of incorporation", entity.incorporationDate],
  ["Registered with", entity.registrar],
  ["Directors", entity.directors.join(", ")],
  ...(entity.gstin ? ([["GSTIN", entity.gstin]] as [string, string][]) : []),
  ["Registered office", entity.address],
];

export const grievance = {
  /** confirm: the company's choice of Grievance Officer: a director by default. */
  name: "Tarun Kumar Singh",
  designation: "Director and Grievance Officer",
  email: "klymbofficial@gmail.com",
  address: entity.address,
  acknowledgeWithin: "24 hours",
  resolveWithin: "15 days",
} as const;

export const policyVersion = {
  version: "2026-11-03",
  effective: "3 November 2026",
} as const;

/**
 * Refund: complete the cohort, get the whole fee back.
 * The conditions below are what make that promise enforceable rather than
 * arguable: confirm each one.
 */
export const refund = {
  headline: "Complete all 30 days and we refund 100% of your fee.",
  /** confirm: is every one of these required? */
  conditions: [
    "All 30 days submitted: a deliverable or answers recorded for every day from 1 to 30",
    "All four weekly assessments submitted and defended (days 7, 14, 21 and 28)",
    "Both interview-prep days submitted (days 29 and 30)",
    "The four checkpoint LinkedIn posts published from your own profile",
    "Your portfolio repository public, with commits on at least 20 separate days",
  ],
  /** confirm: must work be done during the cohort, or can days be caught up afterwards? */
  window: "Every submission must be made by the end of your Day 30. Work backfilled after your 30 days end does not count towards completion.",
  /** confirm: 14 working days, and to the original payment method? */
  payout: "Refunds are paid to the original payment method within 14 working days of your Day 30, once completion has been verified by your reviewer.",
  partial: "There is no partial refund. Completing 29 of 30 days does not qualify: the point of the guarantee is finishing.",
  /** confirm: is this right? A learner who is removed for cheating presumably forfeits. */
  forfeit: "A place ended for plagiarism, fabricated evidence or undisclosed AI use does not qualify for the refund.",
  cancellation: "Cancel before your Day 1 opens and you are refunded in full, no conditions. After that, the completion guarantee above is the route to a refund.",
} as const;

/**
 * System Design: finish the whole course, get the whole fee back. It is sold
 * in early access, so nobody can finish until the last lesson is out, and the
 * conditions below are what stop five short lessons refunding the full fee.
 *
 * ⚠️ `confirm` marks what should be checked by counsel before the first sale.
 */
export const sdRefund = {
  headline: "Complete System Design end to end and we refund 100% of your fee.",
  earlyAccess: `System Design is sold in early access. ${BUILT_LESSONS.length} of its ${LESSON_TOTAL} lessons are live today. The rest are released as they are ready and are included in what you paid.`,
  /** confirm: is every one of these required? */
  conditions: [
    `All ${LESSON_TOTAL} lessons finished, from Day 1 to Day ${LESSON_TOTAL}`,
    "The lesson check passed on every lesson, signed in with the Google account you paid with",
    "The final assessment taken",
  ],
  /** confirm: the 60 days, and how it reads against the date the last lesson is promised for. */
  window: "You can claim once the last lesson is out, and up to 60 days after that. Until then the course cannot be finished, so no claim can be made.",
  /** confirm: 14 working days. Razorpay refuses a normal refund on a payment older than six months. */
  payout: "Refunds are paid to the original payment method within 14 working days of your claim, once completion has been verified. If the payment is too old for our payment provider to refund, we pay it by bank transfer instead.",
  partial: "There is no partial refund. Finishing some of the lessons does not qualify: the point of the guarantee is finishing.",
  /** confirm: is this right? */
  forfeit: "Access ended for cheating, shared accounts or fabricated results does not qualify for the refund.",
  /** confirm: does this need a stated window? */
  duplicate: "If you are charged twice for the course by mistake, write to us and we refund the extra payment.",
  referral: {
    headline: `Get ${SD_REFERRAL.friends} friends to buy System Design within ${SD_REFERRAL.days} days of your purchase and we refund 100% of your fee. You keep the course.`,
    conditions: [
      `${SD_REFERRAL.friends} different people each buy the course with their own Google account, using your link or referral code`,
      `Each of them pays within ${SD_REFERRAL.days} days of your purchase. If you bought before this offer began, your ${SD_REFERRAL.days} days start on the day it began`,
      "Each of them still has their seat when your refund is paid",
    ],
    payout: "We refund 100% of what you paid, whatever price your friends paid, to your original payment method within 14 working days of your third friend's purchase, once we have verified it. You do not need to claim it.",
    once: "A payment is refunded once. Referring more friends does not earn more money, and if you also finish the course you still get your fee back only once. Friends you refer get no discount.",
    forfeit: "Referring yourself, using fake or shared accounts, or spamming people with your link does not qualify, and we may end the referral for it.",
  },
} as const;

export const dataPoints = {
  collected: [
    ["Registration", "Name, email, phone, chosen track, current role, years of experience, optional LinkedIn URL, and your consent to be contacted"],
    ["Account", "Your Google account email, name and profile image, through Google sign-in"],
    ["Evidence accounts", "The GitHub username and LinkedIn profile you declare, so submitted links can be checked as yours"],
    ["Coursework", "Daily submissions, deliverable links, your notes, knowledge-check answers, checkpoint LinkedIn post links, assessment scores and reviewer feedback"],
    ["LinkedIn posting (optional)", "Only if you connect LinkedIn to post in one tap: an access token that lets us publish posts you confirm, your LinkedIn member ID and display name, and when that permission expires. The token and ID are stored encrypted. We never read your feed, connections, messages or email, and nothing is posted unless you tap Post"],
    ["Payments", "For System Design: what you paid, when, Razorpay's order and payment IDs, the campaign link you came from, and any refund. Card, UPI and bank details go to Razorpay and never reach us"],
    ["Referrals", "Your referral code, whose code you used when you bought System Design, and how many people bought with yours. People who open your link see your first name. We never tell anyone who bought"],
    ["Technical logs", "IP address, request time, path, status and browser type, processed by our hosting provider to serve pages and keep the service secure"],
    ["Analytics", "Aggregate usage measured with Google Analytics 4, on by default and switchable off at /cookies; cookieless page-view and page-speed counts from Vercel"],
  ],
  processors: [
    ["Vercel", "Website hosting, technical logs, and cookieless web analytics and speed insights", "United States and global edge network"],
    ["Neon", "Database holding registrations, learner records, submissions, lesson results and payment records", "United States"],
    ["Razorpay", "Taking payments and issuing refunds", "India"],
    ["Brevo", "Sending receipts and course emails", "European Union"],
    ["Amazon SES", "Sending course emails, through our mail service", "Global"],
    ["Cloudflare", "Storing and delivering course videos", "Global"],
    ["Supabase", "Live messages that sign a second device out, holding no personal records", "Tokyo, Japan"],
    ["Google", "Sign-in (OAuth) and Google Analytics 4", "Global"],
    ["LinkedIn", "Publishing the posts you confirm, with their image, to your own LinkedIn feed, only if you connect it", "Global"],
  ],
} as const;
