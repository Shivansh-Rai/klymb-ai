import { HIDE_MONEY } from "@/lib/site-status";
import type { Evidence, Faq, Source, WeekPhase } from "@/types/program";

export const brand = {
  name: "Klymb.ai",
  tagline: "Get ready for the AI era in 30 days.",
};

const allNavLinks = [
  { label: "Program", href: "/program" },
  { label: "Career Tracks", href: "/tracks" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];
export const navLinks = HIDE_MONEY ? allNavLinks.filter((l) => l.href !== "/#pricing") : allNavLinks;

export const hero = {
  eyebrow: "Get ready for the AI era in 30 days",
  headline: "Become Job-Ready in 30 Days",
  subheadline:
    "Choose your target role, solve real workplace problems every day, complete weekly assessments and prepare for interviews with a structured career track.",
  /** The working professional's first question, answered in the hero. */
  timeLine: "1–2 hrs a day, in your own time. Start any day.",
  primaryCta: { label: "Choose My Career Track", href: "/tracks" },
  secondaryCta: { label: "See How the 30 Days Work", href: "/#how-it-works" },
};

/** The story beat under the hero. */
export const statement = "Your title is the liability. Your domain knowledge is the asset.";

export const statementSupport =
  "The traditional resume describes who you claimed to be in the past. Real-world capability proves what problems you are ready to resolve today.";

/** Section intros used by the landing page. */
export const sectionCopy = {
  evidence: {
    eyebrow: "Why it's time",
    title: "The work is changing. The evidence is public.",
    intro: "Companies no longer hire for general potential. They recruit specifically to solve immediate execution gaps.",
  },
  howItWorks: { eyebrow: "How it works", title: "30 days, 1 problem at a time" },
  tracks: {
    eyebrow: "Career paths",
    title: "Five roles. Pick the one you want next.",
    intro: "Each track has its own 30 daily problems, four assessments and two days of interview prep, written for that one role.",
  },
  faq: { eyebrow: "FAQ", title: "Straight answers.", intro: "Everything you need to know before enrolling." },
} as const;

export const inclusions = [
  { figure: "1", label: "Selected career track", detail: "Everything you do is specific to the role you want." },
  { figure: "30", label: "Practical daily challenges", detail: "One real workplace problem a day." },
  { figure: "4", label: "Weekly assessments", detail: "After Days 7, 14, 21 and 28, with feedback." },
  { figure: "1+", label: "Role-specific project", detail: "Evidence you can show an interviewer." },
  { figure: "✓", label: "Interview preparation", detail: "Role-specific questions and answer frameworks." },
  { figure: "2", label: "Interview-prep days", detail: "Days 29 and 30: the most-asked questions." },
];

export const sources = {
  wef: {
    label: "World Economic Forum, Future of Jobs Report 2025",
    url: "https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/",
  },
  pwc: {
    label: "PwC, 2025 Global AI Jobs Barometer",
    url: "https://www.pwc.com/gx/en/news-room/press-releases/2025/ai-linked-to-a-fourfold-increase-in-productivity-growth.html",
  },
  microsoft: {
    label: "Microsoft Research, Working with AI (2025)",
    url: "https://www.microsoft.com/en-us/research/publication/working-with-ai-measuring-the-occupational-implications-of-generative-ai/",
  },
  qaSalary: {
    label: "SoftwareTestPilot, QA Salary Guide 2026 (India)",
    url: "https://softwaretestpilot.com/qa-salary-guide",
  },
  aiSalary: {
    label: "Futurense, AI Engineer Salary in India",
    url: "https://futurense.com/blog/ai-engineer-salary-in-india",
  },
  linkedinReadiness: {
    label: "LinkedIn survey, January 2026 (via Careers360)",
    url: "https://news.careers360.com/ai-reshapes-hiring-84-indian-professionals-feel-unprepared-in-2026-top-hiring-job-roles-linkedin-survey",
  },
} satisfies Record<string, Source>;

/**
 * Every figure here must link to a public source.
 * Re-check figures before launch; reports are updated yearly.
 */
export const evidence: Evidence[] = [
  {
    figure: "92M",
    claim: "Jobs expected to be displaced globally by 2030, while 170M new roles are created. The shift rewards people who reskill.",
    source: sources.wef,
  },
  {
    figure: "56%",
    claim: "Average wage premium for jobs that require AI skills, up from 25% the year before.",
    source: sources.pwc,
  },
  {
    figure: "84%",
    claim: "Of Indian professionals feel unprepared to find a new job in 2026, as AI reshapes how companies hire.",
    source: sources.linkedinReadiness,
  },
];

export const howItWorks = [
  { title: "Choose a track", body: "Pick one of five roles. Everything after this is specific to it." },
  { title: "Solve a daily workplace problem", body: "One realistic problem a day, the kind the role actually faces." },
  { title: "Complete the weekly assessment", body: "After Days 7, 14, 21 and 28: scored, with feedback." },
  { title: "Build role-specific evidence", body: "Your work becomes a portfolio piece you can walk through." },
  { title: "Practice for interviews", body: "Role-specific questions, frameworks and practice answers." },
  { title: "Prepare for interviews", body: "Days 29 and 30: answer the most-asked questions for your role." },
];

export const weekPhases: WeekPhase[] = [
  { week: 1, name: "Foundations", days: "Days 1–7", summary: "The core concepts and tools of the role, and how AI is changing them." },
  { week: 2, name: "Practical execution", days: "Days 8–14", summary: "Doing the actual work, end to end, on realistic scenarios." },
  { week: 3, name: "Real-world problem solving", days: "Days 15–21", summary: "Messy, ambiguous problems with trade-offs and stakeholders." },
  { week: 4, name: "Portfolio and interview readiness", days: "Days 22–28", summary: "Finish your project and prepare to present it." },
];

export const mockInterviewPhase = {
  days: "Days 29–30",
  name: "Interview prep",
  summary: "The most-asked technical, scenario and behavioural questions, answered in writing.",
};

export const outcomes = [
  "Solve role-specific workplace problems",
  "Build evidence of practical ability",
  "Complete weekly assessments",
  "Improve communication and decision-making",
  "Practice for the most-asked interview questions",
];

export const valueBreakdown = [
  "30 daily practical problems",
  "4 weekly assessments",
  "Role-specific projects",
  "Progress tracking",
  "Interview preparation",
  "The most-asked interview questions, with model answers",
];

/**
 * What "complete" means for the refund, in full, shown next to the price so
 * nobody meets a condition for the first time on the legal page. Must match
 * section 2 of the Refund Policy.
 */
export const refundConditions = [
  "All 30 days submitted by Day 30",
  "All 4 weekly assessments submitted and defended",
  "Both interview-prep days submitted (Days 29–30)",
  "4 checkpoint posts published on your LinkedIn",
  "A public portfolio repo with commits on 20+ days",
];
export const refundTiming = "Paid to your original payment method within 14 working days of your Day 30. Cancel before Day 1 for a full refund, no conditions.";

/** Placeholder answers are marked. Replace once policies are final. */
export const faqs: Faq[] = [
  {
    question: "Who is this program for?",
    answer:
      "Working professionals and graduates who want to move into, or level up within, one of our five roles: QA Engineer, L1/L2 Support, Project Manager, Junior Developer or Reporting Analyst.",
  },
  {
    question: "Do I need prior experience?",
    answer:
      "No prior experience in the target role is required, but you should be comfortable using a computer daily and committing 1–2 hours a day. Some tracks recommend basic familiarity with the domain; each track page lists who it is for.",
  },
  {
    question: "Can I change my track?",
    answer:
      "Not after you enroll. Each track has its own 30-day project, assessments and reviewer, so switching mid-cohort would mean starting again. If something has changed for you, write to us and we will talk it through.",
  },
  {
    question: "What happens every day?",
    answer:
      "You receive one practical workplace problem for your track, work on it, and submit your solution. Each problem builds towards that week's assessment and your final project.",
  },
  {
    question: "How do weekly assessments work?",
    answer:
      "After Days 7, 14, 21 and 28 you complete an assessment based on that week's work. It is scored against a rubric and you receive feedback on what to improve.",
  },
  {
    question: "How do you prepare me for interviews?",
    answer: "Days 29 and 30 are interview prep: you answer the questions most often asked for your role, in writing, using your own portfolio as evidence.",
  },
  {
    question: "Is employment guaranteed?",
    answer:
      "No. Klymb.ai does not guarantee a job, placement or salary. The program is designed to build practical ability, evidence and interview readiness: outcomes depend on you and the job market.",
  },
  {
    question: "What is included in the price?",
    answer:
      "One career track with 30 daily problems, 4 weekly assessments with feedback, role-specific projects, progress tracking, interview preparation.",
  },
  {
    question: "Will you try to sell me another course?",
    answer:
      "No. There is no advanced program or mastermind to upsell. The track you pick is complete on its own, and if you complete it the fee comes back. System Design is a separate course, there only if you want it.",
  },
  {
    question: "What is the refund policy?",
    answer:
      "Complete all 30 days and you get 100% of your fee back. Completion means every day submitted, all four assessments taken and both interview-prep days submitted: the full conditions are on the Refund Policy page.",
  },
];

export const urgency = {
  headline: "The next cohort closes before your role does.",
  support: "Secure your place and build the capability your next company is actively seeking.",
};

export const footerLinks = {
  program: [
    { label: "Career Tracks", href: "/tracks" },
    { label: "Program", href: "/program" },
    { label: "Register", href: "/register" },
    { label: "Learner sign-in", href: "/learn/login" },
  ],
  company: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Terms", href: "/terms" },
    ...(HIDE_MONEY ? [] : [{ label: "Refund Policy", href: "/refund-policy" }]),
  ],
};

export const roleOptions = ["Student / graduate", "Manual tester", "Support executive", "Coordinator / PM", "Developer", "Analyst", "Career switcher", "Other"];
export const experienceOptions = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];

/** Why the fee comes back, said plainly. */
export const whyRefund = {
  title: "Why we give your money back.",
  intro:
    "Most online courses are paid for and never finished. We price the program so that finishing is the whole point.",
  points: [
    { title: "You pay to commit", body: "A fee makes you show up on Day 12 when motivation is low. Free programs are easy to abandon." },
    { title: "You finish, you get it back", body: "Submit all 30 days, take the four assessments and complete both interview-prep days. We refund 100% of the fee." },
    { title: "We only win if you finish", body: "Your completion is what we show the next cohort. That is why every assessment gets individual feedback." },
  ],
  promises: [
    "No upsell. There is no advanced course to pitch you at the end.",
    "No hidden fees. The price on the track is the price you pay.",
    "No invented seat counters or countdown timers.",
    "Real people review your work, not only an automated grader.",
  ],
};

