import { initConfig } from "./config";
import { buildNumber, scriptInfo } from "./constants";
import { initObservers } from "./observers";
import { addStyle, domLoaded } from "./utils";
import { getChaptersFromComments } from "./features/setlistChapters";
import { applyChapterOverlay, removeOverlay } from "./features/chapterOverlay";

/** Runs when the userscript is loaded initially */
async function init() {
  await initConfig();

  if(domLoaded)
    run();
  else
    document.addEventListener("DOMContentLoaded", run);
}

/** Runs after the DOM is available */
async function run() {
  try {
    console.log(`[YS2C] Initializing ${scriptInfo.name} v${scriptInfo.version} (#${buildNumber})...`);

    // post-build these double quotes are replaced by backticks (because if backticks are used here, the bundler converts them to double quotes)
    addStyle("#{{GLOBAL_STYLE}}", "global");

    initObservers();
    initSetlistChapters();
  }
  catch(err) {
    console.error("Fatal error:", err);
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
      console.log("[YS2C] Not a watch page, skipping.");
      return;
    }

    console.log(`[YS2C] Navigation detected → video: ${videoId}`);
    removeOverlay();

    const chapters = await getChaptersFromComments(videoId);
    if (chapters)
      await applyChapterOverlay(chapters);
  };

  console.log("[YS2C] Attaching yt-navigate-finish listener");

  // handle the page that's already loaded when the script runs
  handleNavigation();

  // handle subsequent SPA navigations
  document.addEventListener("yt-navigate-finish", handleNavigation);
}

init();
