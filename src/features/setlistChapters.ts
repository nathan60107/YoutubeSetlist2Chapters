import { Innertube } from "youtubei.js";
import { activeCommentFindStrategy } from "../commentFinder";
import { parseChapters } from "../chapterParser";
import { hasOfficialChapters } from "../officialChapters";
import { getSetlistPick } from "../setlistPicks";
import { log, warn, error } from "../log";
import type { CommentCandidate, RawNextResponse, SetlistCandidate } from "../types";

/** How many comment pages to fetch (~20 comments each) — setlists are sometimes ranked far down */
const COMMENT_PAGES = 3;

let yt: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!yt) {
    log("Creating Innertube instance...");
    // retrieve_player: false — only /next is used, so skip fetching and evaluating the player JS
    yt = await Innertube.create({ retrieve_player: false });
    log("Innertube ready");
  }
  return yt;
}

/** Calls an Innertube endpoint and returns the raw, unparsed JSON response. */
async function rawNext(
  innertube: Innertube,
  payload: Record<string, unknown>,
): Promise<RawNextResponse> {
  const res: any = await innertube.actions.execute("/next", { ...payload, parse: false });
  return res.data ?? res;
}

/** Recursively finds the comment section's initial continuation token */
function findCommentSectionToken(node: any): string | null {
  if (!node || typeof node !== "object") return null;
  if (node.itemSectionRenderer?.sectionIdentifier === "comment-item-section") {
    const t = node.itemSectionRenderer.contents?.[0]?.continuationItemRenderer
      ?.continuationEndpoint?.continuationCommand?.token;
    if (t) return t;
  }
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const r = findCommentSectionToken(v);
    if (r) return r;
  }
  return null;
}

/**
 * Finds the "next page of comments" token.
 *
 * A recursive search is wrong here: the continuationItemRenderer that expands a comment's replies
 * looks identical (its trigger is ON_ITEM_SHOWN too), so depth-first hits that one first and
 * paging turns into walking one thread's replies. The right token is always the last item of the
 * comment list (BODY slot / append).
 */
function findNextPageToken(page: any): string | null {
  for (const ep of page.onResponseReceivedEndpoints ?? []) {
    const reload = ep.reloadContinuationItemsCommand;
    const items = reload?.slot === "RELOAD_CONTINUATION_SLOT_BODY"
      ? reload.continuationItems
      : ep.appendContinuationItemsAction?.continuationItems;
    if (!items?.length) continue;
    const token = items[items.length - 1]?.continuationItemRenderer?.continuationEndpoint
      ?.continuationCommand?.token;
    if (token) return token;
  }
  return null;
}

/**
 * Fetches top-level comments as raw `/next` JSON, paging on from the given watch response.
 *
 * Deliberately not `innertube.getComments()`: youtubei.js 13.4.0's `CommentView.applyMutations`
 * throws when `comment.avatar` is missing ("can't access property 'endpoint', comment.avatar is
 * undefined"), intermittently on the very same video. Reading the text straight out of
 * `entityBatchUpdate`'s `commentEntityPayload` bypasses the parser entirely. This mirrors what
 * `test/fetch-video-data.mjs` does, so the runtime sees the same comments the regression suite
 * measures against.
 */
async function fetchComments(
  innertube: Innertube,
  watch: RawNextResponse,
  videoId: string,
): Promise<CommentCandidate[]> {
  let token = findCommentSectionToken(watch);
  const out: CommentCandidate[] = [];

  for (let i = 0; i < COMMENT_PAGES && token; i++) {
    const page = await rawNext(innertube, { continuation: token });
    const mutations = page.frameworkUpdates?.entityBatchUpdate?.mutations ?? [];
    for (const m of mutations) {
      const p = m.payload?.commentEntityPayload;
      if (!p) continue;
      // replyLevel 0 = top-level comment; replies can't hold the setlist
      if (p.properties?.replyLevel) continue;
      out.push({
        id: p.properties?.commentId ?? `${videoId}#${out.length}`,
        text: p.properties?.content?.content ?? "",
      });
    }
    token = findNextPageToken(page);
  }
  return out;
}

/** Everything a video offers as a setlist, and which of those is currently on the progress bar */
export type SetlistLookup = {
  /** Every comment that holds a setlist, in the order YouTube ranked them */
  candidates: SetlistCandidate[];
  /** The candidate whose chapters should be drawn, or null when the video offers none */
  selected: SetlistCandidate | null;
};

const noSetlists: SetlistLookup = { candidates: [], selected: null };

/**
 * Decides which setlist to draw.
 *
 * A pick the user made on this video wins outright — it was made in front of the alternatives, so
 * it is a better answer than any heuristic. Otherwise {@link activeCommentFindStrategy} chooses.
 */
function selectSetlist(candidates: SetlistCandidate[], videoId: string) {
  const pickedId = getSetlistPick(videoId);
  const picked = pickedId ? candidates.find(c => c.id === pickedId) : undefined;
  if (picked) {
    log(`Using the comment ${pickedId} remembered for this video (${picked.chapters.length} chapters)`);
    return picked;
  }
  if (pickedId)
    warn(`Remembered comment ${pickedId} is no longer among this video's setlists — falling back to "${activeCommentFindStrategy.name}"`);

  const target = activeCommentFindStrategy.find(candidates);
  if (!target) {
    warn(`No qualifying comment found (strategy: "${activeCommentFindStrategy.name}"). None yielded enough chapters.`);
    return null;
  }

  log(`Selected comment ${target.id} with ${target.chapters.length} chapters (strategy: "${activeCommentFindStrategy.name}")`);
  return target;
}

/**
 * Fetches the top-level comments for the given video and works out every setlist it offers, along
 * with the one to draw — none at all if the creator already chaptered the video.
 *
 * Every comment is parsed, not just the winner, so the reader can be shown the alternatives and
 * switch between them; what counts as a setlist is left entirely to
 * {@link activeCommentFindStrategy}.
 */
export async function findSetlists(videoId: string): Promise<SetlistLookup> {
  try {
    log(`Fetching comments for video: ${videoId}`);

    const innertube = await getInnertube();
    const watch = await rawNext(innertube, { videoId });

    // The creator's chapters win: YouTube already draws them on the progress bar, so anything
    // this script adds would only sit on top of a better-informed answer.
    if (hasOfficialChapters(watch)) {
      log("Video already carries official chapters — leaving the progress bar untouched");
      return noSetlists;
    }

    const comments = await fetchComments(innertube, watch, videoId);
    log(`Fetched ${comments.length} top-level comment(s) across up to ${COMMENT_PAGES} page(s)`);

    const parsed: SetlistCandidate[] = comments.map(c => ({ ...c, chapters: parseChapters(c.text) }));
    log("Comments (id, chapters):", parsed.map(c => ({ id: c.id, chapters: c.chapters.length, preview: c.text.slice(0, 60).replace(/\n/g, "↵") })));

    const candidates = parsed.filter(c => activeCommentFindStrategy.qualifies(c));
    log(`${candidates.length} comment(s) hold a setlist:`, candidates.map(c => `${c.id} → ${c.chapters.length} chapters`));

    const selected = selectSetlist(candidates, videoId);
    if (selected)
      log(`Drawing ${selected.chapters.length} chapters from comment ${selected.id}:`, selected.chapters);

    return { candidates, selected };
  }
  catch (err) {
    error("Failed to get chapters from comments:", err);
    return noSetlists;
  }
}
