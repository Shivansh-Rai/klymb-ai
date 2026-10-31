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
    title: "Foundations · a shopping app",
    flow: ["Client", "Server", "Database"],
    lessons: [
      ["What is system design? The last pair of shoes", "6:19"],
      ["How an app works: from a tap to a saved cart", "6:49"],
      ["Why applications slow down", "0:00"],
      ["Load balancing", "0:00"],
      ["Database foundations", "0:00"],
      ["Caching and content delivery", "0:00"],
      ["Replication and sharding", "0:00"],
      ["Queues and background work", "0:00"],
    ],
  },
  {
    title: "Interview practice · worked designs",
    flow: ["Clarify", "Design", "Trade-offs"],
    lessons: [
      ["The interview framework", "0:00"],
      ["Reliability and overload", "0:00"],
      ["Design a notification service", "0:00"],
      ["Design a social news feed", "0:00"],
      ["Design a ticket-booking system", "0:00"],
      ["Design a chat application", "0:00"],
      ["Design a video streaming system", "0:00"],
      ["Mock interview and revision", "0:00"],
    ],
  },
  {
    title: "Introduction to AI system design",
    flow: ["Question", "Retrieve", "Model"],
    lessons: [
      ["Design a basic AI assistant", "0:00"],
      ["RAG: answering from documents", "0:00"],
      ["AI serving: tokens, latency and cost", "0:00"],
      ["AI quality and safety", "0:00"],
      ["Capstone: a document-based AI assistant", "0:00"],
    ],
  },
];

/** The lessons that exist, by lesson id ("module-lesson", zero-based). Every other lesson is coming soon. */
export const BUILT_LESSONS = ["0-0", "0-1"];
/** Open to everyone. None: the course overview video is the free part, and every lesson needs a seat. */
export const FREE_LESSONS: string[] = [];

export type Question =
  | { type: "mcq" | "timed"; typeLabel: string; topic: string; prompt: string; options: string[]; ans: number }
  | { type: "multi"; typeLabel: string; topic: string; prompt: string; options: string[]; ans: number[] }
  | { type: "diagram"; typeLabel: string; topic: string; prompt: string; ans: number }
  | { type: "order"; typeLabel: string; topic: string; prompt: string; items: string[]; start: number[] }
  | { type: "text"; typeLabel: string; topic: string; prompt: string };

/** The pre- and post-assessment ask the same six questions, one of each type. */
export const QUESTIONS: Question[] = [
  { type: "mcq", typeLabel: "Multiple choice", topic: "Scaling", prompt: "A service gets 10× more reads than writes. What helps most first?", options: ["Add read replicas and a cache", "Shard the database by user", "Add a message queue in front", "Move to one bigger server"], ans: 0 },
  { type: "multi", typeLabel: "Multi-select", topic: "Load balancing", prompt: "Which make app servers safe to add or remove behind a load balancer? Pick all that apply.", options: ["Sessions in a shared store", "Uploaded files on local disk", "An in-memory counter on each server", "No user state kept on the server"], ans: [0, 3] },
  { type: "diagram", typeLabel: "Pick the architecture", topic: "Availability", prompt: "Which design keeps taking orders if one database node dies?", ans: 1 },
  { type: "order", typeLabel: "Order the steps", topic: "Request flow", prompt: "Put a read that misses the cache in order.", items: ["DNS lookup", "Load balancer", "App server", "Cache (miss)", "Database"], start: [1, 3, 0, 4, 2] },
  { type: "text", typeLabel: "Short answer", topic: "Trade-offs", prompt: "In a sentence or two: during a network partition, what does CAP make you choose between?" },
  { type: "timed", typeLabel: "Timed · 30 seconds", topic: "Estimation", prompt: "1 crore daily users each make 20 requests. Roughly what’s the average requests per second?", options: ["About 230", "About 2,300", "About 23,000", "About 2,30,000"], ans: 1 },
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

/** The inbox's messages. Until there is a backend to send them, these are the examples the design ships with. */
export const NOTIFICATIONS: Notif[] = [
  { id: 1, type: "reply", title: "Klymb team replied", body: "“If I have auto-scaling, why pre-scale at all?”", time: "12 min ago", group: "Today", unread: true, go: "player" },
  { id: 2, type: "streak", title: "Your 6-day streak is waiting", body: "One lesson step keeps it.", time: "2 h ago", group: "Today", unread: true, go: "progress" },
  { id: 3, type: "badge", title: "Badge earned: First pass", body: "First lesson check passed.", time: "Yesterday", group: "Earlier", unread: false, go: "progress" },
  { id: 4, type: "module", title: "Day 3 is out", body: "Why applications slow down · 15 min", time: "2 days ago", group: "Earlier", unread: false, go: "course" },
  { id: 5, type: "assess", title: "Your retake is open", body: "Day 1 rewatched. Try again.", time: "4 days ago", group: "Earlier", unread: false, go: "player" },
];

/** The welcome screen: what the course gives you, before Day 1. [title, detail] */
export const WELCOME: [string, string][] = [
  ["21 days, from the basics", "Start with what a client, server and database do. No system design experience needed."],
  ["A 6–8 minute Hinglish video a day", "One shopping app that grows as you learn, with the captions on screen."],
  ["You think first, then learn", "Pause, answer in your own words, then compare with a model answer."],
  ["Practice that feels like the interview", "Drag-and-drop designs, scenario questions and full design problems."],
  ["Interviewer follow-ups", "What they commonly ask next, and an answer you can say out loud."],
  ["An introduction to AI system design", "The last five days: AI assistants, RAG, cost, latency and safety."],
];
