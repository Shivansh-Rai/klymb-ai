/**
 * Shared shape of a "System Design Essentials" lesson. Both languages of a day
 * must keep the same questions and choices in the same order: saved answers are
 * choice indexes, so switching language keeps a learner's progress.
 */

export type Lang = "en" | "hi";

export interface Choice {
  text: string;
  /** Why this choice is (or isn't) the best move. Shown after answering. */
  why: string;
  best?: boolean;
}

export interface Question {
  id: string;
  scenario?: string;
  prompt: string;
  choices: Choice[];
}

export interface Source {
  label: string;
  href: string;
}

export interface ConceptCard {
  name: string;
  examples: string[];
  moves: string[];
}

/** "Build it yourself": drag each box to the slot whose job it does. */
export interface BuildTask {
  title: string;
  intro: string;
  /** The fixed node at the top of the diagram (e.g. "Your phone"). */
  given: string;
  /** Slot ids per row, top to bottom. */
  rows: string[][];
  /** A heading for each row, when the rows are phases (e.g. "Before the sale"). Without one a row shows only its number. */
  rowLabels?: string[];
  slots: Record<string, { role: string; answer: string }>;
  /** Boxes in the tray; `does` is shown as the hint after a wrong drop. A chip no slot answers is a decoy. */
  chips: { id: string; label: string; does: string }[];
  done: string;
}

/** A back-of-the-envelope estimate: type a number, then see the working. */
export interface Estimate {
  id: string;
  prompt: string;
  /** The facts to work from. */
  given: string[];
  unit: string;
  answer: number;
  /** Accepted as right within this fraction of the answer (0.2 = ±20%). */
  tolerance: number;
  /** The working, step by step. */
  working: string[];
}

/** A full design problem: the learner writes an attempt before the walkthrough opens. */
export interface DesignAttempt {
  title: string;
  brief: string;
  constraints: string[];
  /** Characters the attempt needs before the walkthrough opens. */
  minChars: number;
  walkthrough: { heading: string; points: string[] }[];
  /** Self-check after reading the walkthrough. */
  checklist: string[];
}

/** An interviewer's "what if" after the main answer, with the model answer. */
export interface FollowUp {
  q: string;
  answer: string[];
  /** The one line worth saying out loud. */
  say: string;
  /** Where the course goes deeper. */
  deeper?: string;
}

export interface DayCopy {
  /** The hook's small pill; defaults to "Interview question". */
  tag?: string;
  hookLines: string[];
  question: string;
  pre: Question[];
  revealTitle: string;
  revealSub: string;
  reveal: { when: string; what: string }[];
  sourceNote?: string;
  /** Terms the video covers that deserve a plain explanation in the reveal (e.g. HTTP, TCP, UDP). */
  explain?: { title: string; items: { term: string; what: string; example: string }[]; optional?: boolean };
  concept: { cards: ConceptCard[]; rule: string };
  post: Question[];
  estimates?: Estimate[];
  build?: BuildTask;
  design?: DesignAttempt;
  followUps?: FollowUp[];
  interview: string[];
  /** The doubts this day actually raises, answered. Shown in the lesson's Q&A tab. */
  faq: { q: string; a: string }[];
  cheatsheet: { title: string; points: string[] };
  linkedin: string;
  nextDay: string;
}

export interface Day {
  day: number;
  of: number;
  app: string;
  minutes: number;
  hook: { date: string; quote?: string; quoteBy?: string };
  copy: Record<Lang, DayCopy>;
  sources: Source[];
  /** Portrait (9:16) for the standalone Day page; `wide` is the 16:9 cut the course app's player plays when it exists. */
  video: {
    src: string; poster: string; minutes: number; lang: string; wide?: { src: string; poster: string };
    /** Other voice-overs of the same cut, picked in the player's Audio setting. `lang` above is the original's. */
    audio?: { lang: string; src: string; wide?: string }[];
  };
  /** Pages around this one; the next day's card links only when it exists. */
  prevHref?: string;
  nextHref?: string;
}
