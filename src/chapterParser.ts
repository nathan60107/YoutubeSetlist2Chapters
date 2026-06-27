import type { Chapter } from "./types";

export type ChapterParseStrategy = {
  name: string;
  /** Parses a single line into a Chapter, or returns null if the line has no timestamp */
  parseLine(line: string): Chapter | null;
};

/** Matches a timestamp at the very start of a trimmed line: 0:00, 1:23, 1:23:45 */
const TIMESTAMP_START_RE = /^(\d{1,2}:\d{2}(?::\d{2})?)/;

/** Strips common separator characters between the timestamp and the chapter title */
const SEPARATOR_RE = /^[\s\-–—|•·:]+/;

function parseTimestampSec(ts: string): number {
  const parts = ts.split(":").map(Number);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

/**
 * Basic strategy: timestamp must appear at the very start of the line.
 * Everything after it (minus a separator) becomes the chapter title.
 * Example: "0:00 - Intro" → { timestampSec: 0, title: "Intro" }
 */
const basicLineParseStrategy: ChapterParseStrategy = {
  name: "basic",
  parseLine(line) {
    const trimmed = line.trim();
    const match = trimmed.match(TIMESTAMP_START_RE);
    if (!match) return null;
    const title = trimmed.slice(match[0].length).replace(SEPARATOR_RE, "").trim();
    if (!title) return null;
    return { timestampSec: parseTimestampSec(match[1]), title };
  },
};

export const activeChapterParseStrategy: ChapterParseStrategy = basicLineParseStrategy;
