/** Custom CLI args passed to rollup */
export type RollupArgs = Partial<{
  "config-mode": "development" | "production";
  "config-branch": "main";
  "config-host": "greasyfork" | "github";
  "config-assetSource": "local" | "github";
  "config-suffix": string;
}>;

/** Configuration object for the script */
export type ScriptConfig = {
  /**
   * Interface language. Either `"auto"` (resolve from the browser's languages) or a supported locale
   * code (`LangCode` from `i18n.ts`, e.g. `"en"`, `"zh-TW"`). Unknown values fall back to auto.
   */
  language: string;
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
