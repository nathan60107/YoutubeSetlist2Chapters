import type { CommentCandidate } from "./types";

export type CommentFindStrategy = {
  name: string;
  /** Picks the best candidate from a list, or returns null if none qualifies */
  find(candidates: CommentCandidate[]): CommentCandidate | null;
};

const TIMESTAMP_RE = /\d{1,2}:\d{2}(?::\d{2})?/g;

/** Counts timestamp-like patterns (e.g. 0:00, 1:23:45) in a string */
export function countTimestamps(text: string): number {
  return (text.match(TIMESTAMP_RE) ?? []).length;
}

// The fewest timestamps a comment must hold to be read as a setlist.
const MIN_TIMESTAMPS = 3;

/** Picks the comment with the highest timestamp count ({@link MIN_TIMESTAMPS} to qualify) */
const mostTimestampsStrategy: CommentFindStrategy = {
  name: "mostTimestamps",
  find(candidates) {
    if (candidates.length === 0) return null;
    const best = candidates.reduce((prev, cur) =>
      cur.timestampCount > prev.timestampCount ? cur : prev
    );
    return best.timestampCount >= MIN_TIMESTAMPS ? best : null;
  },
};

export const activeCommentFindStrategy: CommentFindStrategy = mostTimestampsStrategy;
