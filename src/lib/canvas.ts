import type { CanvasPart, CanvasTask } from "@/data/system-design/types";

/** A learner's board: boxes placed by position (0–1 across and down), and arrows between them by box id. */
export interface Board {
  nodes: { id: string; part: CanvasPart; x: number; y: number }[];
  edges: [string, string][];
}

export const emptyBoard = (): Board => ({ nodes: [], edges: [] });

/** "client>server": a connection between two kinds of part, in the direction of the arrow. */
export const pairKey = (from: CanvasPart, to: CanvasPart) => `${from}>${to}`;

function pairs(board: Board) {
  const part = new Map(board.nodes.map((n) => [n.id, n.part]));
  const out = new Set<string>();
  for (const [a, b] of board.edges) {
    const pa = part.get(a);
    const pb = part.get(b);
    if (pa && pb) out.add(pairKey(pa, pb));
  }
  return out;
}

export type ConnectionResult = { key: string; from: CanvasPart; to: CanvasPart; state: "ok" | "reversed" | "missing" };

/**
 * Compares a board with the model, connection by connection. Each model
 * connection is "ok" when the learner drew it, "reversed" when they drew it
 * the other way round, and "missing" otherwise. Extra parts and arrows aren't
 * marked wrong: a design can carry more than the model and still be right.
 */
export function gradeBoard(task: CanvasTask, board: Board) {
  const have = pairs(board);
  const part = new Map(task.model.nodes.map((n) => [n.id, n.part]));
  const seen = new Set<string>();
  const results: ConnectionResult[] = [];
  for (const [a, b] of task.model.edges) {
    const from = part.get(a)!;
    const to = part.get(b)!;
    const key = pairKey(from, to);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ key, from, to, state: have.has(key) ? "ok" : have.has(pairKey(to, from)) ? "reversed" : "missing" });
  }
  const needed = new Set(task.model.nodes.map((n) => n.part));
  const extra = [...new Set(board.nodes.map((n) => n.part))].filter((p) => !needed.has(p));
  return { results, score: results.filter((r) => r.state === "ok").length, of: results.length, extra };
}
