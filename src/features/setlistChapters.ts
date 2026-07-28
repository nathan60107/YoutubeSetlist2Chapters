import { Innertube } from "youtubei.js";
import { activeCommentFindStrategy, countTimestamps } from "../commentFinder";
import { activeChapterParseStrategy } from "../chapterParser";
import { log, warn, error } from "../log";
import type { Chapter, CommentCandidate } from "../types";

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
async function rawNext(innertube: Innertube, payload: Record<string, unknown>): Promise<any> {
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
 * Fetches top-level comments as raw `/next` JSON.
 *
 * Deliberately not `innertube.getComments()`: youtubei.js 13.4.0's `CommentView.applyMutations`
 * throws when `comment.avatar` is missing ("can't access property 'endpoint', comment.avatar is
 * undefined"), intermittently on the very same video. Reading the text straight out of
 * `entityBatchUpdate`'s `commentEntityPayload` bypasses the parser entirely. This mirrors what
 * `test/fetch-video-data.mjs` does, so the runtime sees the same comments the regression suite
 * measures against.
 */
async function fetchComments(innertube: Innertube, videoId: string): Promise<CommentCandidate[]> {
  const watch = await rawNext(innertube, { videoId });
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
      const text = p.properties?.content?.content ?? "";
      out.push({
        id: p.properties?.commentId ?? `${videoId}#${out.length}`,
        text,
        timestampCount: countTimestamps(text),
      });
    }
    token = findNextPageToken(page);
  }
  return out;
}

/**
 * Fetches the top-level comments for the given video, selects the best
 * setlist candidate using {@link activeCommentFindStrategy}, then parses it
 * into chapters using {@link activeChapterParseStrategy}.
 *
 * Returns null if no qualifying comment is found or parsing yields no chapters.
 */
export async function getChaptersFromComments(videoId: string): Promise<Chapter[] | null> {
  try {
    log(`Fetching comments for video: ${videoId}`);

    const innertube = await getInnertube();
    const candidates = await fetchComments(innertube, videoId);

    log(`Fetched ${candidates.length} top-level comment(s) across up to ${COMMENT_PAGES} page(s)`);
    log("Candidates (id, timestampCount):", candidates.map(c => ({ id: c.id, timestampCount: c.timestampCount, preview: c.text.slice(0, 60).replace(/\n/g, "↵") })));

    const target = activeCommentFindStrategy.find(candidates);
    if (!target) {
      warn(`No qualifying comment found (strategy: "${activeCommentFindStrategy.name}"). None had enough timestamps.`);
      return null;
    }

    log(`Selected comment ${target.id} with ${target.timestampCount} timestamp(s) (strategy: "${activeCommentFindStrategy.name}")`);
    log("Target comment text:\n", target.text);

    const chapters: Chapter[] = [];
    for (const line of target.text.split("\n")) {
      const chapter = activeChapterParseStrategy.parseLine(line);
      if (chapter) chapters.push(chapter);
    }

    if (chapters.length <= 1) {
      warn(`Parsed only ${chapters.length} chapter(s) from target comment — need at least 2. Aborting.`);
      return null;
    }

    log(`Successfully parsed ${chapters.length} chapters:`, chapters);
    return chapters;
  }
  catch (err) {
    error("Failed to get chapters from comments:", err);
    return null;
  }
}
