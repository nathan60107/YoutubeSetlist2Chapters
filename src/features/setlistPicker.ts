/**
 * Puts a text button on every comment that holds a setlist: the one in use says so, the rest offer
 * to take its place.
 */

import "./setlistPicker.css";
import { debounce } from "@sv443-network/userutils";
import { TIMESTAMP_RE } from "../chapterParser";
import { t } from "../i18n";
import { log, warn } from "../log";
import { waitForElement } from "../utils";
import type { SetlistCandidate } from "../types";

/** The comment section as a whole — present on the watch page well before the comments load into it */
const COMMENTS_SEL = "ytd-comments#comments";
/** One rendered comment. Replies use the same element, but a reply never matches a candidate */
const COMMENT_SEL = "ytd-comment-view-model";
/** The comment's own text, without the author, the like count or the reply row around it */
const CONTENT_SEL = "#content-text";

/**
 * Where the button goes, best first: the row that already holds Like and Reply, then the engagement
 * bar around it, then the comment's main column. Only the first is the intended home — the rest keep
 * the button reachable (on its own line, under the comment) if YouTube renames that row.
 */
const HOST_SELECTORS = ["#toolbar", "ytd-comment-engagement-bar", "#main"];

const BUTTON_CLASS = "ys2c-setlist-pick";
const ACTIVE_CLASS = "ys2c-setlist-pick--active";

/** How long the comment section is given to appear before the picker gives up on the video */
const COMMENTS_TIMEOUT_MS = 30_000;

/** The parser's timestamp, made global so `match` returns every one rather than the first */
const ALL_TIMESTAMPS_RE = new RegExp(TIMESTAMP_RE, "g");

/**
 * The comment's timestamps in the order they appear, joined — how a candidate fetched from the API
 * is paired with the element YouTube rendered for it.
 *
 * The two texts are never byte-identical (custom emoji become `<img>`, whitespace collapses,
 * `#content-text` drops the shortcodes the API spells out), and the rendered element carries no id
 * we can rely on, but a setlist's timestamps survive rendering untouched. Three or more of them in
 * a fixed order is specific enough that no two comments on one video collide — measured across all
 * 143 test videos, no pair of setlist comments shares a fingerprint.
 */
function timestampFingerprint(text: string): string {
  return (text.match(ALL_TIMESTAMPS_RE) ?? []).join("|");
}

export type SetlistPickerOptions = {
  /** Every setlist the video offers */
  candidates: SetlistCandidate[];
  /** The one already drawn on the progress bar, if any */
  selectedId: string | null;
  /** Called when the reader picks a different setlist */
  onPick: (candidate: SetlistCandidate) => void;
};

/** Candidates keyed by {@link timestampFingerprint}, which is how a rendered comment is matched back */
let candidatesByFingerprint = new Map<string, SetlistCandidate>();
let selectedId: string | null = null;
let pickHandler: SetlistPickerOptions["onPick"] | null = null;
let observer: MutationObserver | null = null;
/** Bumped by every mount and unmount, so a mount still waiting on the comment section can tell it is stale */
let mountId = 0;

/** Removes every injected button and stops watching for new comments */
export function unmountSetlistPicker() {
  mountId++;
  observer?.disconnect();
  observer = null;
  candidatesByFingerprint = new Map();
  selectedId = null;
  pickHandler = null;
  document.querySelectorAll(`.${BUTTON_CLASS}`).forEach(btn => btn.remove());
}

/**
 * Starts labelling the comments that hold a setlist.
 *
 * Comments arrive as the reader scrolls, and YouTube re-stamps the ones already on screen, so the
 * section is watched for the lifetime of the video rather than decorated once.
 */
export async function mountSetlistPicker({ candidates, selectedId: initialId, onPick }: SetlistPickerOptions) {
  unmountSetlistPicker();

  if(candidates.length === 0) {
    log("No setlist on this video — nothing to label");
    return;
  }

  const id = mountId;
  candidatesByFingerprint = new Map(candidates.map(c => [timestampFingerprint(c.text), c]));
  selectedId = initialId;
  pickHandler = onPick;

  let root: Element;
  try {
    root = await waitForElement(COMMENTS_SEL, COMMENTS_TIMEOUT_MS);
  }
  catch(err) {
    warn((err as Error).message);
    return;
  }

  // A navigation while we were waiting already tore this mount down
  if(id !== mountId)
    return;

  observer = new MutationObserver(debounce(decorateComments, 200));
  observer.observe(root, { childList: true, subtree: true });
  decorateComments();

  log(`Setlist picker watching the comment section for ${candidates.length} setlist(s)`);
}

/** Gives every rendered comment that holds a setlist its button, and refreshes the labels */
function decorateComments() {
  for(const comment of document.querySelectorAll<HTMLElement>(COMMENT_SEL)) {
    const text = comment.querySelector(CONTENT_SEL)?.textContent ?? "";
    const candidate = candidatesByFingerprint.get(timestampFingerprint(text));
    if(!candidate)
      continue;

    const button = comment.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}`)
      ?? insertButton(comment, candidate);
    if(button)
      labelButton(button, candidate);
  }
}

function insertButton(comment: HTMLElement, candidate: SetlistCandidate): HTMLButtonElement | null {
  const host = HOST_SELECTORS.reduce<HTMLElement | null>(
    (found, sel) => found ?? comment.querySelector<HTMLElement>(sel),
    null,
  );
  if(!host) {
    warn("Found a setlist comment but nowhere to put its button");
    return null;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = BUTTON_CLASS;
  // The comment body has click handlers of its own (expanding a collapsed comment, among others),
  // and picking a setlist should not also unfold the comment it was picked from
  button.addEventListener("click", (evt) => {
    evt.stopPropagation();
    pick(candidate);
  });

  host.appendChild(button);
  return button;
}

/** Applies the reader's pick: the buttons re-label first, then the caller redraws the progress bar */
function pick(candidate: SetlistCandidate) {
  if(candidate.id === selectedId)
    return;
  selectedId = candidate.id;
  decorateComments();
  pickHandler?.(candidate);
}

/** The one in use says so and is inert; the rest offer to take its place */
function labelButton(button: HTMLButtonElement, candidate: SetlistCandidate) {
  const active = candidate.id === selectedId;
  button.classList.toggle(ACTIVE_CLASS, active);
  button.disabled = active;
  button.title = t("picker.chapterCount", candidate.chapters.length);

  // Only written when it actually changes: the label lives inside the observed subtree, and
  // rewriting it unconditionally would be a mutation that schedules the next pass, forever
  const label = t(active ? "picker.inUse" : "picker.use");
  if(button.textContent !== label)
    button.textContent = label;
}
