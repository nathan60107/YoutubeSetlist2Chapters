import { log } from "./log";
import type { RawNextResponse } from "./types";

/**
 * The fewest official chapters a video must carry before the script stands down.
 *
 * Unreachable as a rejection today: YouTube itself requires three timestamps before it will make
 * chapters, so `DESCRIPTION_CHAPTERS` never holds one or two. Kept because the floor is this
 * script's own position rather than a restatement of YouTube's — were that rule relaxed, a video
 * marked only "Start" / "Ending" is still worth annotating from the comments.
 *
 * @see https://support.google.com/youtube/answer/9884579
 */
const MIN_OFFICIAL_CHAPTERS = 3;

/**
 * The creator's own chapters, written as timestamps in the description.
 *
 * `AUTO_CHAPTERS` sits in the same map but is YouTube's guess rather than the creator's work, so
 * it is deliberately not counted — the point is to defer to a human who already did this job.
 */
const CREATOR_CHAPTERS_KEY = "DESCRIPTION_CHAPTERS";

/**
 * Finds the player bar's marker map in a raw `/next` response.
 *
 * Searched recursively rather than read from
 * `playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer.decoratedPlayerBarRenderer
 * .playerBar.multiMarkersPlayerBarRenderer` — the renderer appears exactly once, so unlike the
 * comment continuation tokens there is no wrong match to hit first, and the surrounding wrappers
 * are the part YouTube reshuffles.
 */
function findMarkersMap(node: any): any[] | null {
  if (!node || typeof node !== "object") return null;
  const markers = node.multiMarkersPlayerBarRenderer?.markersMap;
  if (Array.isArray(markers)) return markers;
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const r = findMarkersMap(v);
    if (r) return r;
  }
  return null;
}

/** Counts the chapters the creator placed on the video, per the raw `/next` watch response. */
function countOfficialChapters(watchResponse: RawNextResponse): number {
  const markersMap = findMarkersMap(watchResponse);
  if (!markersMap) return 0;

  const entry = markersMap.find(m => m?.key === CREATOR_CHAPTERS_KEY);
  return entry?.value?.chapters?.length ?? 0;
}

/**
 * Whether the video already carries enough creator-provided chapters that the script should leave
 * the progress bar alone.
 */
export function hasOfficialChapters(watchResponse: RawNextResponse): boolean {
  const count = countOfficialChapters(watchResponse);
  log(`Official (creator-provided) chapters on this video: ${count}`);
  return count >= MIN_OFFICIAL_CHAPTERS;
}
