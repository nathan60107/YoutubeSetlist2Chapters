/* global copy */
/**
 * 在 YouTube 頁面（搜尋結果 / 頻道影片列表 / 首頁 / 播放清單）的 DevTools Console 執行。
 * 蒐集頁面上所有影片連結，只保留標題含關鍵字的項目，輸出成 Markdown 表格並複製到剪貼簿。
 */
(async () => {
  /** 標題需含其中任一關鍵字（不分大小寫） */
  const KEYWORDS = ["歌枠", "歌回", "karaoke", "うたわく", "sing"];
  /** 是否自動捲動到底把懶載入的項目全部載出 */
  const AUTO_SCROLL = true;
  /** 捲動時每輪等待毫秒 */
  const SCROLL_DELAY = 800;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  if (AUTO_SCROLL) {
    let lastHeight = -1;
    let stable = 0;
    while (stable < 3) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      await sleep(SCROLL_DELAY);
      const h = document.documentElement.scrollHeight;
      if (h === lastHeight) stable++;
      else {
        stable = 0;
        lastHeight = h;
      }
      console.log(`[collect] 捲動中… height=${h}`);
    }
    window.scrollTo(0, 0);
  }

  /** aria-label 會在標題後面接上「2 小時 12 分鐘」之類的時長，切掉 */
  const DURATION_RE =
    /\s+(?:\d+\s*(?:小時|hours?|hour)\s*)?(?:\d+\s*(?:分鐘|minutes?|minute)\s*)?(?:\d+\s*(?:秒|seconds?|second))?\s*$/;
  const stripDuration = (s) => {
    const cut = s.replace(DURATION_RE, "").trim();
    return cut || s; // 整個標題都被切掉時保留原字串
  };

  /** 從 <a> 盡量取出人類可讀的標題 */
  const titleOf = (a) => {
    const direct =
      a.getAttribute("title") ||
      a.getAttribute("aria-label") ||
      a.textContent.trim();
    if (direct && direct.length > 2)
      return stripDuration(direct.replace(/\s+/g, " ").trim());
    // thumbnail 之類的無文字連結：往上找容器內的標題節點
    const box = a.closest(
      "ytd-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, " +
        "ytd-compact-video-renderer, ytd-playlist-video-renderer, yt-lockup-view-model",
    );
    const t = box?.querySelector(
      "#video-title, .yt-lockup-metadata-view-model__title, h3 a, [title]",
    );
    const text = t?.getAttribute("title") || t?.textContent?.trim() || "";
    return stripDuration(text.replace(/\s+/g, " ").trim());
  };

  const byId = new Map();
  for (const a of document.querySelectorAll("a[href*='/watch?v=']")) {
    const id = new URL(a.href, location.origin).searchParams.get("v");
    if (!id) continue;
    const title = titleOf(a);
    if (!title) continue;
    // 同一影片可能有多個連結（縮圖 + 標題），保留最長的標題
    const prev = byId.get(id);
    if (!prev || title.length > prev.length) byId.set(id, title);
  }

  const kw = KEYWORDS.map((k) => k.toLowerCase());
  const rows = [...byId]
    .filter(([, title]) => kw.some((k) => title.toLowerCase().includes(k)))
    .map(([id, title]) => ({
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
    }));

  console.log(`[collect] 頁面影片 ${byId.size} 部，命中關鍵字 ${rows.length} 部`);
  console.table(rows);

  const md = rows
    .map((r) => `| [${r.title.replace(/\|/g, "／")}](<${r.url}>) |  |  |`)
    .join("\n");
  const json = JSON.stringify(rows, null, 2);

  try {
    await navigator.clipboard.writeText(md);
    console.log("[collect] Markdown 表格列已複製到剪貼簿");
  } catch {
    copy(md); // DevTools 專用 fallback
  }

  window.__collected = rows;
  console.log("結果也存在 window.__collected；要 JSON 請執行 copy(JSON.stringify(__collected))");
  return { count: rows.length, md, json };
})();
