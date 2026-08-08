import type { SetlistCandidate } from "./types";

export type CommentFindStrategy = {
  name: string;
  /** Whether a comment holds a setlist at all */
  qualifies(candidate: SetlistCandidate): boolean;
  /** Picks the best candidate from a list, or returns null if none qualifies */
  find(candidates: SetlistCandidate[]): SetlistCandidate | null;
};

/**
 * The fewest songs a comment must yield to be read as a setlist.
 *
 * Counted on parsed chapters, not timestamps in the text, so one song is one song however it was
 * written — a range (`4:55~7:52 曲名`) spends two timestamps on one. Three is also a count no
 * ordinary comment reaches by accident: a reply pointing at a moment or two stays under it.
 */
const MIN_CHAPTERS = 3;

const isSetlist = (candidate: SetlistCandidate) => candidate.chapters.length >= MIN_CHAPTERS;

/** Picks the comment that yielded the most chapters ({@link MIN_CHAPTERS} to qualify) */
const mostChaptersStrategy: CommentFindStrategy = {
  name: "mostChapters",
  qualifies: isSetlist,
  find(candidates) {
    if (candidates.length === 0) return null;
    const best = candidates.reduce((prev, cur) =>
      cur.chapters.length > prev.chapters.length ? cur : prev
    );
    return isSetlist(best) ? best : null;
  },
};

export const activeCommentFindStrategy: CommentFindStrategy = mostChaptersStrategy;
