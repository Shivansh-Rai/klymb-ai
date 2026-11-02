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
  /** [title, duration "m:ss", what the day covers]. The description shows on the course list even before the day is released. */
  lessons: [string, string, string][];
}

export const MODULES: CourseModule[] = [
  {
    title: "Days 1–8 · Build your system design foundation",
    flow: ["Client", "Server", "Database"],
    lessons: [
      ["What is system design?", "6:19", "Understand what system design means, why it matters, and how clients, servers and databases work together. Explore what can happen when two users try to buy the last available item."],
      ["How does an application work?", "6:49", "Follow a request from the user's screen to the server and database. Learn about APIs, requests, responses, authentication and storing data."],
      ["Why do applications slow down?", "6:32", "Understand latency, throughput, concurrency and bottlenecks. Explore how a sudden sale can increase traffic and affect an application."],
      ["Load balancing and multiple servers", "5:52", "Learn how requests can be distributed across servers, why health checks matter and how an application can respond when a server becomes unavailable."],
      ["Database foundations", "6:00", "Explore tables, keys, relationships, indexes and transactions. Learn how to think about storing and retrieving application data."],
      ["Caching and content delivery", "6:08", "Learn how caching can reduce repeated work, what happens on a cache hit or miss, and why keeping cached data fresh matters. Get introduced to CDNs."],
      ["Replication, sharding and consistency", "6:05", "Understand how database replicas and sharding can help with growing workloads, along with challenges like stale data and uneven traffic."],
      ["Queues and background work", "0:00", "Learn how queues and workers handle tasks such as notifications. Explore retries, duplicate tasks and why some work can happen after the user receives a response."],
    ],
  },
  {
    title: "Days 9–16 · Apply your knowledge to interview problems",
    flow: ["Clarify", "Design", "Trade-offs"],
    lessons: [
      ["Your system design interview framework", "0:00", "Learn a step-by-step approach to unfamiliar questions: clarify requirements, estimate scale, define data and APIs, draw the architecture, and discuss trade-offs. Apply it to a URL shortener."],
      ["Reliability and handling overload", "5:09", "Explore timeouts, retries, circuit breakers, rate limiting and graceful degradation. Learn how systems can respond when traffic rises or a service becomes slow."],
      ["Design a notification system", "0:00", "Design a system that sends email, SMS or push notifications. Consider user preferences, provider failures, retries and delivery status."],
      ["Design a social media feed", "4:48", "Explore how posts reach followers and compare fan-out on write, fan-out on read and hybrid approaches."],
      ["Design a ticket booking system", "0:00", "Learn how to prevent double booking with temporary seat holds and protected database updates. Explore payment delays and expired reservations."],
      ["Design a chat system", "0:00", "Design a basic messaging system with persistent connections, message storage and offline delivery. Understand the difference between a message being saved, delivered and read."],
      ["Design a video streaming system", "0:00", "Explore video uploads, storage, transcoding, CDNs and adaptive quality. Learn why a video may switch quality when the viewer's connection changes."],
      ["Revision: design a whole system from scratch", "0:00", "Put the framework into practice with an unfamiliar design problem. Draw the whole system on a blank board, then compare it with a model design: requirements, architecture, bottlenecks, failures and trade-offs."],
    ],
  },
  {
    title: "Days 17–21 · Get started with AI system design",
    flow: ["Question", "Retrieve", "Model"],
    lessons: [
      ["Design a simple AI assistant", "0:00", "Understand how an application connects a user to an AI model. Get introduced to tokens, context, latency, cost and the possibility of inaccurate answers."],
      ["Build the architecture for a RAG assistant", "0:00", "Learn how an assistant can retrieve information from documents before generating an answer. Explore chunking, embeddings, vector indexes, permissions and hybrid search."],
      ["AI latency, cost and model choices", "0:00", "Learn how token usage affects cost and limits. Explore streaming responses, token rate limits, model routing and fallback models when a primary model is unavailable."],
      ["AI safety, quality and data access", "0:00", "Explore how to evaluate AI answers, handle unsupported responses and think about prompt injection. Learn the basics of tenant isolation and document permissions."],
      ["AI system design capstone", "0:00", "Bring the concepts together by designing a document-based AI assistant. Explain its retrieval flow, data access, model choices, failure handling and evaluation approach."],
    ],
  },
];

/** The lessons that exist, by lesson id ("module-lesson", zero-based). Every other lesson is coming soon. */
export const BUILT_LESSONS = ["0-0", "0-1", "0-2", "0-3", "0-4", "0-5", "0-6", "1-1", "1-3"];
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
