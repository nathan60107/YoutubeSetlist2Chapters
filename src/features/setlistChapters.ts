import { Innertube } from "youtubei.js";
import { activeCommentFindStrategy, countTimestamps } from "../commentFinder";
import { activeChapterParseStrategy } from "../chapterParser";
import type { Chapter, CommentCandidate } from "../types";

/** Maximum number of top comments to evaluate as setlist candidates */
const CANDIDATE_COUNT = 20;

let yt: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!yt) {
    console.log("[YS2C] Creating Innertube instance...");
    yt = await Innertube.create();
    console.log("[YS2C] Innertube ready");
  }
  return yt;
}

/**
 * Fetches the first page of comments for the given video, selects the best
 * setlist candidate using {@link activeCommentFindStrategy}, then parses it
 * into chapters using {@link activeChapterParseStrategy}.
 *
 * Returns null if no qualifying comment is found or parsing yields no chapters.
 */
export async function getChaptersFromComments(videoId: string): Promise<Chapter[] | null> {
  try {
    console.log(`[YS2C] Fetching comments for video: ${videoId}`);

    const innertube = await getInnertube();
    const commentsPage = await innertube.getComments(videoId);

    const totalFetched = commentsPage.contents.length;
    console.log(`[YS2C] Fetched ${totalFetched} comment(s), evaluating top ${Math.min(totalFetched, CANDIDATE_COUNT)}`);

    const candidates: CommentCandidate[] = commentsPage.contents
      .slice(0, CANDIDATE_COUNT)
      .map(thread => {
        const text = thread.comment?.content?.toString() ?? "";
        return {
          id: thread.comment?.comment_id ?? "",
          text,
          timestampCount: countTimestamps(text),
        };
      });

    console.debug("[YS2C] Candidates (id, timestampCount):", candidates.map(c => ({ id: c.id, timestampCount: c.timestampCount, preview: c.text.slice(0, 60).replace(/\n/g, "↵") })));

    const target = activeCommentFindStrategy.find(candidates);
    if (!target) {
      console.warn(`[YS2C] No qualifying comment found (strategy: "${activeCommentFindStrategy.name}"). None had enough timestamps.`);
      return null;
    }

    console.log(`[YS2C] Selected comment ${target.id} with ${target.timestampCount} timestamp(s) (strategy: "${activeCommentFindStrategy.name}")`);
    console.debug("[YS2C] Target comment text:\n", target.text);

    const chapters: Chapter[] = [];
    for (const line of target.text.split("\n")) {
      const chapter = activeChapterParseStrategy.parseLine(line);
      if (chapter) chapters.push(chapter);
    }

    if (chapters.length <= 1) {
      console.warn(`[YS2C] Parsed only ${chapters.length} chapter(s) from target comment — need at least 2. Aborting.`);
      return null;
    }

    console.log(`[YS2C] Successfully parsed ${chapters.length} chapters:`, chapters);
    return chapters;
  }
  catch (err) {
    console.error("[YS2C] Failed to get chapters from comments:", err);
    return null;
  }
}
