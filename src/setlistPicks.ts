/**
 * Remembers which comment the user picked as the setlist, per video.
 *
 * Only a deliberate pick is written here — the comment the script chose on its own is never
 * recorded. A stored entry therefore always means "the automatic answer was wrong on this video and
 * here is the right one", so it can be honoured without second-guessing it on the next visit.
 */

import { DataStore } from "@sv443-network/userutils";
import { log } from "./log";

/** One video and the comment the user pointed at */
type SetlistPick = {
  videoId: string;
  commentId: string;
};

type SetlistPicksData = {
  /** Least-recently-picked first, so trimming drops the oldest */
  picks: SetlistPick[];
};

/** How many videos to remember. A pair of short ids each, so 300 of them stay a few kilobytes */
const MAX_PICKS = 300;

const picksStore = new DataStore({
  id: "setlist-picks",
  defaultData: { picks: [] as SetlistPick[] } satisfies SetlistPicksData,
  // increment this value if the data format changes:
  formatVersion: 1,
  migrations: {},
});

export async function initSetlistPicks() {
  await picksStore.loadData();
}

/** The comment the user picked for this video, or null if they never picked one */
export function getSetlistPick(videoId: string): string | null {
  return picksStore.getData().picks.find(p => p.videoId === videoId)?.commentId ?? null;
}

/** Records the user's pick for this video, replacing any earlier one and trimming the oldest away */
export async function saveSetlistPick(videoId: string, commentId: string) {
  const picks = picksStore.getData().picks
    .filter(p => p.videoId !== videoId)
    .concat({ videoId, commentId })
    .slice(-MAX_PICKS);

  await picksStore.setData({ picks });
  log(`Remembered comment ${commentId} as the setlist for video ${videoId}`);
}
