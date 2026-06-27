import "./chapterOverlay.css";
import type { Chapter } from "../types";

const PROGRESS_BAR_SEL = ".ytp-progress-bar";
const VIDEO_SEL = "video.html5-main-video";
const CONTAINER_CLASS = "ys2c-chapter-segments";
const SEGMENT_CLASS = "ys2c-chapter-segment";
const TOOLTIP_CLASS = "ys2c-chapter-tooltip";
const TOOLTIP_VISIBLE_CLASS = "ys2c-chapter-tooltip--visible";

/** Assumed song duration when no explicit end time is available (J-pop / Vocaloid average) */
const DEFAULT_SONG_DURATION_SEC = 240; // 4 minutes

type Segment = {
  startSec: number;
  endSec: number;
  title: string;
};

let currentContainer: HTMLDivElement | null = null;
let currentTooltip: HTMLDivElement | null = null;
let currentCleanup: (() => void) | null = null;

export function removeOverlay(): void {
  currentCleanup?.();
  currentCleanup = null;
  currentContainer?.remove();
  currentContainer = null;
  currentTooltip?.remove();
  currentTooltip = null;
  console.log("[YS2C] Chapter overlay removed");
}

/**
 * Derives render segments from parsed chapters.
 *
 * End time priority:
 *   1. `chapter.endTimestampSec` — set by parsers supporting the two-timestamp format
 *   2. `start + DEFAULT_SONG_DURATION_SEC` — assumed duration
 *
 * In both cases the result is capped at `min(nextChapterStart, videoDuration)`
 * so segments never overlap.
 */
function computeSegments(chapters: Chapter[], videoDuration: number): Segment[] {
  // Sort ascending and drop duplicates — comment parsers may return chapters
  // in display order which is not always chronological.
  const sorted = [...chapters]
    .sort((a, b) => a.timestampSec - b.timestampSec)
    .filter((ch, i, arr) => i === 0 || ch.timestampSec !== arr[i - 1].timestampSec);

  const segments = sorted.map((ch, i) => {
    const startSec = ch.timestampSec;
    const nextStartSec = sorted[i + 1]?.timestampSec ?? videoDuration;

    const rawEnd = ch.endTimestampSec !== undefined
      ? ch.endTimestampSec
      : startSec + DEFAULT_SONG_DURATION_SEC;

    // Never extend past the next chapter or the video end
    const endSec = Math.min(rawEnd, nextStartSec, videoDuration);

    return { startSec, endSec, title: ch.title };
  });

  console.log("[YS2C] Computed segments:", segments.map(s =>
    `${s.title} [${s.startSec.toFixed(1)}s – ${s.endSec.toFixed(1)}s]`
  ).join(", "));

  return segments;
}

function getOrCreateTooltip(): HTMLDivElement {
  if (!currentTooltip) {
    currentTooltip = document.createElement("div");
    currentTooltip.className = TOOLTIP_CLASS;
    document.body.appendChild(currentTooltip);
  }
  return currentTooltip;
}

function showTooltip(text: string, clientX: number, barTop: number): void {
  const tip = getOrCreateTooltip();
  tip.textContent = text;
  tip.style.left = `${clientX}px`;
  tip.style.top = `${barTop}px`;
  tip.classList.add(TOOLTIP_VISIBLE_CLASS);
}

function hideTooltip(): void {
  currentTooltip?.classList.remove(TOOLTIP_VISIBLE_CLASS);
}

function injectSegments(
  progressBar: HTMLElement,
  segments: Segment[],
  videoDuration: number,
): void {
  removeOverlay();

  const container = document.createElement("div");
  container.className = CONTAINER_CLASS;

  for (const seg of segments) {
    const widthPct = ((seg.endSec - seg.startSec) / videoDuration) * 100;
    if (widthPct <= 0) continue;

    const el = document.createElement("div");
    el.className = SEGMENT_CLASS;
    el.style.left = `${(seg.startSec / videoDuration) * 100}%`;
    el.style.width = `${widthPct}%`;
    container.appendChild(el);
  }

  progressBar.prepend(container);
  currentContainer = container;

  // Use mousemove on the bar itself (not the segments) so seeking is unaffected.
  // Segments stay pointer-events: none; we detect hover by comparing the cursor
  // position against the computed segment ranges.
  const onMouseMove = (e: MouseEvent) => {
    const rect = progressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const cursorSec = pct * videoDuration;

    const hovered = segments.find(s => cursorSec >= s.startSec && cursorSec < s.endSec);
    if (hovered)
      showTooltip(hovered.title, e.clientX, rect.top);
    else
      hideTooltip();
  };

  progressBar.addEventListener("mousemove", onMouseMove);
  progressBar.addEventListener("mouseleave", hideTooltip);

  currentCleanup = () => {
    progressBar.removeEventListener("mousemove", onMouseMove);
    progressBar.removeEventListener("mouseleave", hideTooltip);
  };

  console.log(`[YS2C] Injected ${segments.length} chapter segment(s) onto the progress bar`);
}

function waitForElement<T extends Element>(selector: string, timeoutMs = 8_000): Promise<T> {
  const existing = document.querySelector<T>(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector<T>(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`[YS2C] Timed out waiting for element: ${selector}`));
    }, timeoutMs);
  });
}

export async function applyChapterOverlay(chapters: Chapter[]): Promise<void> {
  if (chapters.length < 2) return;

  console.log("[YS2C] Waiting for progress bar...");

  let progressBar: HTMLElement;
  try {
    progressBar = await waitForElement<HTMLElement>(PROGRESS_BAR_SEL);
  }
  catch (err) {
    console.warn((err as Error).message);
    return;
  }

  const video = document.querySelector<HTMLVideoElement>(VIDEO_SEL);
  if (!video) {
    console.warn("[YS2C] Video element not found");
    return;
  }

  const tryInject = () => {
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      console.warn("[YS2C] Video duration not ready:", duration);
      return;
    }
    console.log(`[YS2C] Video duration: ${duration}s — computing segments`);
    const segments = computeSegments(chapters, duration);
    injectSegments(progressBar, segments, duration);
  };

  if (video.readyState >= 1)
    tryInject();
  else {
    console.log("[YS2C] Waiting for video metadata...");
    video.addEventListener("loadedmetadata", tryInject, { once: true });
  }
}
