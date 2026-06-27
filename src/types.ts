/** Custom CLI args passed to rollup */
export type RollupArgs = Partial<{
  "config-mode": "development" | "production";
  "config-branch": "main";
  "config-host": "greasyfork" | "github" | "openuserjs";
  "config-assetSource": "local" | "github";
  "config-suffix": string;
}>;

/** Configuration object for the script */
export type ScriptConfig = {
  // add data here
};

/** A single chapter derived from a comment setlist */
export type Chapter = {
  timestampSec: number;
  /**
   * Explicit end time in seconds — populated by parsers that support the
   * two-timestamp-per-line format (e.g. "0:00 - 3:45 Song Title").
   * When absent, the overlay computes an estimated end time.
   */
  endTimestampSec?: number;
  title: string;
};

/** A comment evaluated as a potential setlist source */
export type CommentCandidate = {
  id: string;
  text: string;
  timestampCount: number;
};
