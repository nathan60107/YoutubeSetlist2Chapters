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

/**
 * A raw, unparsed `/next` response — the watch page fetched once per video and then read for both
 * the official chapters and the comment section.
 *
 * youtubei.js has `IRawResponse`, but it bottoms out in `RawNode = Record<string, any>` and types
 * `frameworkUpdates` as plain `any`, so it checks nothing. This describes the one path read
 * straight off the response instead; the fields reached by walking the tree are left to the
 * walkers, which take the node as it comes.
 *
 * Every field is optional — a branch that isn't there is a normal outcome (no comments on the
 * video), not an error, and callers are written to fall through rather than throw.
 */
export type RawNextResponse = {
  frameworkUpdates?: {
    entityBatchUpdate?: {
      mutations?: {
        payload?: {
          /** One top-level comment, arriving here rather than in the rendered tree */
          commentEntityPayload?: {
            properties?: {
              commentId?: string;
              /** Absent or 0 on a top-level comment; anything higher is a reply */
              replyLevel?: number;
              content?: { content?: string };
            };
          };
        };
      }[];
    };
  };
};
