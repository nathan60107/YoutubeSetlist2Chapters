import { config, initConfig } from "./config";
import { buildNumber, scriptInfo } from "./constants";
import { initI18n } from "./i18n";
import { log, error } from "./log";
import { initObservers } from "./observers";
import { addStyle, domLoaded } from "./utils";
import { getChaptersFromComments } from "./features/setlistChapters";
import { applyChapterOverlay, removeOverlay } from "./features/chapterOverlay";

/** Runs when the userscript is loaded initially */
async function init() {
  await initConfig();
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

function initSetlistChapters() {
  const handleNavigation = async () => {
    const videoId = getCurrentVideoId();
    if (!videoId) {
      log("Not a watch page, skipping.");
      return;
    }

    log(`Navigation detected → video: ${videoId}`);
    removeOverlay();

    const chapters = await getChaptersFromComments(videoId);
    if (chapters)
      await applyChapterOverlay(chapters);
  };

  log("Attaching yt-navigate-finish listener");

  // handle the page that's already loaded when the script runs
  handleNavigation();

  // handle subsequent SPA navigations
  document.addEventListener("yt-navigate-finish", handleNavigation);
}

init();
