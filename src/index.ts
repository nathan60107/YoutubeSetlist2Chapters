import { config, initConfig } from "./config";
import { buildNumber, scriptInfo } from "./constants";
import { initI18n } from "./i18n";
import { log, error } from "./log";
import { initObservers } from "./observers";
import { initSetlistPicks, saveSetlistPick } from "./setlistPicks";
import { addStyle, domLoaded } from "./utils";
import { findSetlists } from "./features/setlistChapters";
import { applyChapterOverlay, removeOverlay } from "./features/chapterOverlay";
import { mountSetlistPicker, unmountSetlistPicker } from "./features/setlistPicker";

/** Runs when the userscript is loaded initially */
async function init() {
  await initConfig();
  await initSetlistPicks();
  initI18n(config.getData().language);

  if(domLoaded)
    run();
  else
    document.addEventListener("DOMContentLoaded", run);
}

/** Runs after the DOM is available */
async function run() {
  try {
    log(`Initializing ${scriptInfo.name} v${scriptInfo.version} (#${buildNumber})...`);

    // post-build these double quotes are replaced by backticks (because if backticks are used here, the bundler converts them to double quotes)
    addStyle("#{{GLOBAL_STYLE}}", "global");

    initObservers();
    initSetlistChapters();
  }
  catch(err) {
    error("Fatal error:", err);
    return;
  }
}

function getCurrentVideoId(): string | null {
  return new URL(location.href).searchParams.get("v");
}

/**
 * Counts navigations, so work started for one video can tell it has been overtaken by the next.
 * Fetching the comments and waiting for the comment section both outlive a quick switch between
 * videos, and either one finishing late would otherwise chapter the wrong video.
 */
let navigationId = 0;

function initSetlistChapters() {
  const handleNavigation = async () => {
    const id = ++navigationId;
    removeOverlay();
    unmountSetlistPicker();

    const videoId = getCurrentVideoId();
    if (!videoId) {
      log("Not a watch page, skipping.");
      return;
    }

    log(`Navigation detected → video: ${videoId}`);

    const { candidates, selected } = await findSetlists(videoId);
    if (id !== navigationId) return;

    if (selected)
      await applyChapterOverlay(selected.chapters);
    if (id !== navigationId) return;

    await mountSetlistPicker({
      candidates,
      selectedId: selected?.id ?? null,
      onPick: async (candidate) => {
        if (id !== navigationId) return;
        await saveSetlistPick(videoId, candidate.id);
        removeOverlay();
        await applyChapterOverlay(candidate.chapters);
      },
    });
  };

  log("Attaching yt-navigate-finish listener");

  // handle the page that's already loaded when the script runs
  handleNavigation();

  // handle subsequent SPA navigations
  document.addEventListener("yt-navigate-finish", handleNavigation);
}

init();
