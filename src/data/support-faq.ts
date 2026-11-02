import { HIDE_MONEY } from "@/lib/site-status";
import { enrolment } from "@/data/config";
import { sdRefund } from "@/data/legal";
import { refundConditions, refundTiming } from "@/data/program";
import { LAUNCH_OFFER, offerOpen } from "@/lib/offer";
import { formatINR } from "@/lib/format";
import { SD_REFERRAL } from "@/lib/sd-offer";
import { allFree } from "@/data/tracks";

export interface SupportAnswer {
  /** Stable id, used for feedback and search. */
  id: string;
  question: string;
  /** Short paragraphs; plain text. */
  answer: string[];
  /** Extra words people type for this question (Hinglish is normalised by the search). */
  keywords?: string[];
  /** One follow-up action, when there is an obvious next step. */
  action?: { label: string; href: string };
}

export interface SupportTopic {
  id: string;
  title: string;
  /** Shown first to signed-in learners, or to visitors deciding whether to join. */
  audience: "both" | "public" | "learner";
  items: SupportAnswer[];
}

export const SUPPORT_EMAIL = "team@klymb.ai";

/**
 * Kamran's answers. Facts come from the same data the site renders, so the bot
 * can never disagree with a page. Edit wording here; add a question by adding
 * an item with a unique id and the words people would type for it.
 */
export function supportTopics(): SupportTopic[] {
  const price = offerOpen()
    ? `Every track is ${formatINR(LAUNCH_OFFER.price)} at launch, until ${LAUNCH_OFFER.endsLabel}. After that, tracks return to their normal prices, shown on each track's page.`
    : "Each track's price is shown on its page and before you pay.";

  const pricing: SupportTopic = allFree
    ? {
        id: "pricing", title: "Price", audience: "both",
        items: [
          { id: "cost", question: "How much does it cost?", keywords: ["price", "fee", "free", "paisa", "cost"], answer: ["Nothing right now: every track is free. All 30 days, the checkpoints and interview prep, with no card and no payment step."], action: { label: "Choose a track", href: "/tracks" } },
        ],
      }
    : {
        id: "pricing", title: "Price and refund", audience: "both",
        items: [
          { id: "cost", question: "How much does it cost?", keywords: ["price", "fee", "paisa", "cost"], answer: [price, "One payment, by UPI, card or net banking through Razorpay. Day 1 is free on every track, so you can try before you pay."], action: { label: "See the tracks", href: "/tracks" } },
          { id: "refund", question: "How does the 100% refund work?", keywords: ["refund", "money back", "wapas"], answer: ["Complete the programme and we refund 100% of what you paid. Complete means all of these:", ...refundConditions.map((c) => `• ${c}`), refundTiming], action: { label: "Full refund policy", href: "/refund-policy" } },
          { id: "paid-locked", question: "I paid but it's still locked", keywords: ["paid", "payment", "locked"], answer: [`Payments usually confirm within a minute. Refresh your dashboard. If it's still locked after 10 minutes, email ${SUPPORT_EMAIL} with your Razorpay payment ID from the receipt.`] },
        ],
      };

  return [
    ...(HIDE_MONEY ? [] : [pricing]),
    {
      id: "start",
      title: "Getting started",
      audience: "public",
      items: [
        { id: "who", question: "Who is Klymb for?", keywords: ["eligible", "fresher", "graduate", "working"], answer: ["Working professionals and graduates moving into, or levelling up in, one of five roles: QA Engineer, L1/L2 Support, Project Manager, Junior Developer or Reporting Analyst."], action: { label: "See the tracks", href: "/tracks" } },
        { id: "experience", question: "Do I need prior experience?", keywords: ["experience", "beginner", "basic"], answer: [`No experience in the target role is needed. You should be comfortable on a computer and able to give it ${enrolment.dailyTime}. Each track page lists who it suits.`] },
        { id: "register", question: "How do I register?", keywords: ["registration", "join", "start"], answer: ["Pick a track, then register with Google (quickest) or the form. You'll need your phone number, current role and a public GitHub repository for your work. Day 1 opens straight away."], action: { label: "Register", href: "/register" } },
        { id: "when-start", question: "When can I start?", keywords: ["start", "date", "cohort", "batch"], answer: ["Any day. Day 1 opens as soon as you register, and your 30 days run from there."] },
        { id: "which-track", question: "Which track should I choose?", keywords: ["choose", "best", "confused", "which"], answer: ["Pick the role you want next, not the one you have. Each track page shows what the job is becoming, who it suits and the 30 days in detail. If you're torn between two, write to us and we'll help."], action: { label: "Compare the tracks", href: "/tracks" } },
        { id: "job", question: "Is a job guaranteed?", keywords: ["job", "placement", "guarantee", "salary", "naukri"], answer: ["No. Klymb doesn't guarantee a job, placement or salary. The course builds practical ability, a portfolio and interview readiness; outcomes depend on you and the job market."] },
      ],
    },
    {
      id: "course",
      title: "How the course works",
      audience: "both",
      items: [
        { id: "daily", question: "What happens each day?", keywords: ["daily", "everyday", "routine", "kaam"], answer: [`One real workplace problem a day, about ${enrolment.dailyTime.replace(" a day", "")}. Read the brief, build the deliverable, push it to your GitHub repo and submit the link.`] },
        { id: "locked", question: "Why can't I open the next day?", keywords: ["locked", "next", "open", "unlock", "khul"], answer: [allFree ? "Days unlock in order: submit today's day and the next one opens straight away." : "Days unlock in order: submit today's day and the next one opens straight away. On a paid track, Days 2 to 30 also need payment."], action: { label: "Open my dashboard", href: "/learn" } },
        { id: "submit", question: "How do I submit a day?", keywords: ["submission", "deliverable", "link"], answer: ["At the bottom of the day's page: paste the link to your work on GitHub (in your own account), add a short note, answer the quick questions and press Submit. You can re-save a day as often as you like."] },
        { id: "missed", question: "I missed a day. What now?", keywords: ["miss", "behind", "catch"], answer: ["No problem: open the day you missed and submit it. Days stay open; they just unlock in order, so finish the earlier one first. Reminders will point you to it."], action: { label: "Open my dashboard", href: "/learn" } },
        { id: "checkpoints", question: "What are the checkpoints?", keywords: ["assessment", "rubric", "score", "weekly"], answer: ["On Days 7, 14, 21 and 28 you complete a checkpoint on that week's work. It's scored against a rubric and you get written feedback. Those days also ask for a short LinkedIn post about what you built."] },
        { id: "mock", question: "How do I prepare for interviews?", keywords: ["interview", "practice", "questions"], answer: ["Days 29 and 30 are interview prep: the questions most often asked for your role, with what a strong answer shows. You write your answers using your own work as the example. Your track page lists the questions too."] },
        { id: "feedback", question: "When do I get feedback?", keywords: ["feedback", "reviewer", "rework"], answer: ["Reviewers look at your submissions and checkpoints and leave notes on the day. If a day is marked Needs rework, fix it and submit again from the same page."] },
        { id: "change-track", question: "Can I change my track?", keywords: ["change", "switch", "different"], answer: ["Not after you enrol: each track has its own 30 days, checkpoints and reviewer, so switching would mean starting again. If something has changed for you, write to us and we'll talk it through."] },
        { id: "certificate", question: "Do I get a certificate?", keywords: ["certificate"], answer: ["No certificate: your evidence is the portfolio in your GitHub repository, the checkpoint feedback and your LinkedIn posts. That's what recruiters can open and check."] },
      ],
    },
    {
      id: "github",
      title: "GitHub and LinkedIn",
      audience: "both",
      items: [
        { id: "why-github", question: "Why do I need a GitHub repository?", keywords: ["github", "portfolio", "repo"], answer: ["Your repository is your portfolio: every day's work goes there, and reviewers check submissions against it. It must be public."] },
        { id: "create-repo", question: "How do I create my repository?", keywords: ["create", "new", "github", "make"], answer: ["On GitHub, create a new public repository with the name the registration page suggests for your track (for example qa-evidence-portfolio). The registration page has a one-click link that fills it in."], action: { label: "Create on GitHub", href: "https://github.com/new" } },
        { id: "profile", question: "It asks for my GitHub and LinkedIn first", keywords: ["profile", "linkedin", "github", "username", "add"], answer: ["Before you submit Day 1, add your GitHub username and LinkedIn profile on your dashboard. Submitted links are checked to be from your own accounts."], action: { label: "Open my dashboard", href: "/learn" } },
        { id: "not-mine", question: "It says the link isn't from my account", keywords: ["account", "belongs", "wrong", "link"], answer: ["The work must be in the GitHub account you added to your profile. Push it to your own repository and submit that link. If you changed your GitHub username, update it on your dashboard first."] },
        { id: "linkedin-post", question: "What are the LinkedIn posts?", keywords: ["linkedin", "post"], answer: ["On checkpoint days (7, 14, 21 and 28) you share a short post about what you built that week and paste the post link with your submission. It makes your work visible to recruiters."] },
      ],
    },
    {
      id: "system-design",
      title: "System Design course",
      audience: "both",
      items: [
        { id: "sd-open", question: "How do I open my System Design course?", keywords: ["system", "design", "course", "open", "bought", "purchased", "login", "dashboard"], answer: ["Log in with the Google account you paid with and the course opens straight away."], action: { label: "Open the course", href: "/learn/system-design" } },
        { id: "sd-paid", question: "I paid, but it asks me to buy again", keywords: ["system", "design", "paid", "payment", "buy", "again", "access", "purchased"], answer: ["You are probably signed in with a different Google account. Log out in Profile and sign in with the one you paid with.", "If it still asks, send your payment ID to the team below."] },
        { id: "sd-next", question: "When does the next lesson open?", keywords: ["system", "design", "lesson", "next", "midnight", "locked", "tomorrow"], answer: ["One lesson a day. Pass today's lesson check and the next one opens at midnight India time.", "If the next lesson isn't out yet, those days don't count as missed."] },
        { id: "sd-refund", question: "How do I get my System Design fee back?", keywords: ["system", "design", "refund", "fee", "back", "money", "friends", "refer"], answer: [sdRefund.headline, `Or get ${SD_REFERRAL.friends} friends to buy within ${SD_REFERRAL.days} days of your purchase. Your fee comes back and you keep the course.`], action: { label: "Read the conditions", href: "/refund-policy" } },
      ],
    },
    {
      id: "account",
      title: "Sign-in and devices",
      audience: "learner",
      items: [
        { id: "other-device", question: "It says I'm signed in on another device", keywords: ["device", "phone", "laptop", "another"], answer: ["Your account works on one device at a time. On the new device, tap Continue on this device: the old one is signed out automatically.", "You can switch up to 5 times a day. If you hit that, ask the team below."] },
        { id: "cant-signin", question: "I can't sign in", keywords: ["signin", "google", "account", "access"], answer: ["Use Continue with Google with the exact email you paid or registered with. A different Google account won't find your place."], action: { label: "Sign in", href: "/learn/login" } },
        { id: "change-email", question: "Can I change my email?", keywords: ["email", "change", "different", "account"], answer: ["Your place is tied to the email you registered with. If you need it moved to another email, send a message to the team below."] },
      ],
    },
    {
      id: "app",
      title: "Reminders and the app",
      audience: "learner",
      items: [
        { id: "reminders-on", question: "How do I turn on reminders?", keywords: ["reminder", "bell", "notification"], answer: ["Tap the bell next to your name in the top bar, then Turn on reminders and Allow. You'll get at most three a day, at 9 am, 2 pm and 8 pm, and only until that day is submitted."] },
        { id: "reminders-off", question: "How do I stop reminders?", keywords: ["reminder", "stop", "off", "band", "disable"], answer: ["Tap the bell in the top bar and choose Turn off. You can also block notifications for klymb.ai in your browser settings."] },
        { id: "no-reminders", question: "I'm not getting reminders", keywords: ["reminder", "not", "missing"], answer: ["Check the bell in the top bar shows a green dot. If it's red, turn reminders on. Also check notifications for klymb.ai (or Chrome) are allowed in your phone's settings, and not marked as spam."] },
        { id: "install", question: "Can I install Klymb as an app?", keywords: ["install", "app", "home screen"], answer: ["Yes. On Android Chrome, use the menu, then Install app. On iPhone, open the site in Safari, tap Share, then Add to Home Screen."] },
        { id: "offline", question: "Does it work offline?", keywords: ["offline", "internet", "network"], answer: ["Days you've opened stay readable offline, and work you submit offline is saved and sent automatically when you're back online."] },
      ],
    },
    {
      id: "privacy",
      title: "Your data",
      audience: "both",
      items: [
        { id: "data", question: "What do you do with my data?", keywords: ["data", "privacy", "personal", "share"], answer: ["We use your details to run your course: sign-in, your submissions, reviews and reminders. We never sell them. The full detail is in the Privacy Policy."], action: { label: "Privacy Policy", href: "/privacy" } },
        { id: "delete", question: "How do I delete my account?", keywords: ["delete", "remove", "account", "data"], answer: ["Send a message to the team below asking to delete your account, from the email you registered with, and we'll remove your data."] },
      ],
    },
  ];
}

/** Every answer in one list, for search. */
export function allSupportAnswers() {
  return supportTopics().flatMap((t) => t.items);
}
