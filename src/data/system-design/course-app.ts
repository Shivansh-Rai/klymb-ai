/**
 * Content for the System Design course app (/learn/system-design).
 *
 * The course is "System Design Essentials": 21 days in three parts,
 * foundations, interview practice, and an introduction to AI system design.
 * This file reaches every browser, so it holds the outline only: the lessons
 * themselves are in lessons.ts, on the server, and are handed to the app by
 * src/lib/sd-lessons.ts according to what the viewer may open. Lessons not in
 * BUILT_LESSONS are listed as coming soon. The six-question final assessment
 * and its diagrams are course-wide.
 */
export interface CourseModule {
  title: string;
  /** Three labels animated on the player's thumbnail while the video plays. */
  flow: [string, string, string];
  /** [title, duration "m:ss"] */
  lessons: [string, string][];
}

export const MODULES: CourseModule[] = [
  {
    title: "Days 1–8 · Foundations",
    flow: ["Client", "Server", "Database"],
    lessons: [
      ["What is system design?", "6:19"],
      ["How does an application work?", "6:49"],
      ["Why do applications slow down?", "6:32"],
      ["Load balancing and multiple servers", "5:52"],
      ["Database foundations", "6:00"],
      ["Caching and content delivery", "6:08"],
      ["Replication, sharding and consistency", "6:05"],
      ["Queues and background work", "0:00"],
    ],
  },
  {
    title: "Days 9–16 · Interview problems",
    flow: ["Clarify", "Design", "Trade-offs"],
    lessons: [
      ["Your system design interview framework", "0:00"],
      ["Reliability and handling overload", "5:09"],
      ["Design a notification system", "0:00"],
      ["Design a social media feed", "4:48"],
      ["Design a ticket booking system", "0:00"],
      ["Design a chat system", "0:00"],
      ["Design a video streaming system", "0:00"],
      ["Revision: design a whole system from scratch", "0:00"],
    ],
  },
  {
    title: "Days 17–21 · AI system design",
    flow: ["Question", "Retrieve", "Model"],
    lessons: [
      ["Design a simple AI assistant", "0:00"],
      ["Build the architecture for a RAG assistant", "0:00"],
      ["AI latency, cost and model choices", "0:00"],
      ["AI safety, quality and data access", "0:00"],
      ["AI system design capstone", "0:00"],
    ],
  },
];

/**
 * The lessons that exist, by lesson id ("module-lesson", zero-based), with the
 * day each went live in India. Adding a lesson here releases it: use the day it
 * really goes out, because learners waiting on it have that day and the next to
 * pass it. Every other lesson is coming soon.
 */
export const LESSON_RELEASES: Record<string, string> = {
  "0-0": "2026-10-31",
  "0-1": "2026-10-31",
  "0-2": "2026-11-02",
  "0-3": "2026-11-02",
  "0-4": "2026-11-02",
  "0-5": "2026-11-02",
  "0-6": "2026-11-02",
  "1-1": "2026-11-02",
  "1-3": "2026-11-02",
};
export const BUILT_LESSONS = Object.keys(LESSON_RELEASES);
/** Open to everyone. None: the course overview video is the free part, and every lesson needs a seat. */
export const FREE_LESSONS: string[] = [];

export type Question =
  | { type: "mcq" | "timed" | "multi"; typeLabel: string; topic: string; prompt: string; options: string[] }
  | { type: "diagram"; typeLabel: string; topic: string; prompt: string }
  | { type: "order"; typeLabel: string; topic: string; prompt: string; items: string[]; start: number[] }
  | { type: "text"; typeLabel: string; topic: string; prompt: string };

/**
 * The final assessment: six questions, one of each type. These reach every
 * browser, so they carry no answers: those are in final.ts, on the server, and
 * the steps of the "order" question are listed shuffled.
 */
export const QUESTIONS: Question[] = [
  { type: "mcq", typeLabel: "Multiple choice", topic: "Scaling", prompt: "A service gets 10× more reads than writes. What helps most first?", options: ["Add read replicas and a cache", "Shard the database by user", "Add a message queue in front", "Move to one bigger server"] },
  { type: "multi", typeLabel: "Multi-select", topic: "Load balancing", prompt: "Which make app servers safe to add or remove behind a load balancer? Pick all that apply.", options: ["Sessions in a shared store", "Uploaded files on local disk", "An in-memory counter on each server", "No user state kept on the server"] },
  { type: "diagram", typeLabel: "Pick the architecture", topic: "Availability", prompt: "Which design keeps taking orders if one database node dies?" },
  { type: "order", typeLabel: "Order the steps", topic: "Request flow", prompt: "Put a read that misses the cache in order.", items: ["Load balancer", "Cache (miss)", "DNS lookup", "Database", "App server"], start: [0, 1, 2, 3, 4] },
  { type: "text", typeLabel: "Short answer", topic: "Trade-offs", prompt: "In a sentence or two: during a network partition, what does CAP make you choose between?" },
  { type: "timed", typeLabel: "Timed · 30 seconds", topic: "Estimation", prompt: "1 crore daily users each make 20 requests. Roughly what’s the average requests per second?", options: ["About 230", "About 2,300", "About 23,000", "About 2,30,000"] },
];

/** Seconds allowed for the timed question. */
export const TIMED_SECONDS = 30;

/** Options for the "pick the diagram" question. Row 0 is the app tier. */
export const DIAGRAMS: { caption: string; rows: string[][] }[] = [
  { caption: "One app server, one database", rows: [["App"], ["DB"]] },
  { caption: "Primary and replica, automatic failover", rows: [["LB"], ["App", "App"], ["Primary", "Replica"]] },
  { caption: "A cache in front of one database", rows: [["App"], ["Cache"], ["DB"]] },
];

export interface QuickCheck { q: string; opts: string[]; ans: number; why: string }

/** The lesson recommended for each assessment topic the learner missed. Lesson ids are "module-lesson", zero-based. */
export const REVIEW_LESSON: Record<string, string> = {
  Scaling: "0-2",
  "Load balancing": "0-3",
  Availability: "0-6",
  "Request flow": "0-1",
  "Trade-offs": "0-0",
  Estimation: "1-0",
};

export type NotifType = "reply" | "streak" | "badge" | "module" | "assess";
export type NotifTarget = "player" | "progress" | "course" | "preresults";

export interface Notif {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  group: "Today" | "Earlier";
  unread: boolean;
  go: NotifTarget;
}

/** The inbox's messages. Empty until there is a backend to send real ones: a learner must never read a made-up reply. */
export const NOTIFICATIONS: Notif[] = [];

/** The welcome screen: what the course gives you, before Day 1. [title, detail] */
export const WELCOME: [string, string][] = [
  ["21 days, from the basics", "Start with what a client, server and database do. No system design experience needed."],
  ["A 6–8 minute Hinglish video a day", "One shopping app that grows as you learn, with the captions on screen."],
  ["You think first, then learn", "Pause, answer in your own words, then compare with a model answer."],
  ["Practice that feels like the interview", "Drag-and-drop designs, scenario questions and full design problems."],
  ["Interviewer follow-ups", "What they commonly ask next, and an answer you can say out loud."],
  ["An introduction to AI system design", "The last five days: AI assistants, RAG, cost, latency and safety."],
];
