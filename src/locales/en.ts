/**
 * English locale — the reference dictionary.
 *
 * Its keys define the {@linkcode TranslationKey} union that every other locale must satisfy, and its
 * values are the runtime fallback used whenever an active locale is missing a key. When you add a new
 * user-facing string, add it here first; TypeScript will then flag it as missing in the other locales.
 *
 * Values may contain trusted inline HTML (e.g. `<code>…</code>`) — they are our own constants, never
 * user input, and are injected through the Trusted Types policy. `%1`, `%2`, … are positional
 * placeholders replaced by {@linkcode t} arguments.
 */
export const en = {
  /** Button on a comment whose setlist is not the one being drawn */
  "picker.use": "Use this setlist",
  /** Same button on the comment whose setlist is currently on the progress bar */
  "picker.inUse": "Setlist in use",
  /** Tooltip on both, %1 being how many chapters that comment yields */
  "picker.chapterCount": "%1 chapters from this comment",
} as const;

/** Every translation key. Each non-reference locale must provide a value for all of these. */
export type TranslationKey = keyof typeof en;

/** Shape of a complete locale dictionary. */
export type Translations = Record<TranslationKey, string>;
