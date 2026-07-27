/**
 * 批次抓取候選影片的說明欄與留言，存到 test/data/<videoId>.json。
 *
 *   node --experimental-fetch test/fetch-video-data.mjs           # 跑 video-ids.txt 全部
 *   node --experimental-fetch test/fetch-video-data.mjs <id> ...  # 只跑指定影片
 *
 * 已抓過的影片會跳過（刪掉 json 就會重抓）。Node 18+ 可省略 --experimental-fetch。
 *
 * 留言不走 yt.getComments()：youtubei.js 13.4.0 的 CommentView.applyMutations 會在
 * comment.avatar 缺席時炸掉（"Cannot read properties of undefined (reading 'endpoint')"），
 * 而且同一部影片時好時壞。這裡直接打 /next 拿原始 JSON，從 entityBatchUpdate 的
 * commentEntityPayload 取文字，繞開整個 parser。
 */
import { Innertube } from "youtubei.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, "data");
/** 留言抓幾頁（一頁約 20 則）— setlist 有時會排在很後面 */
const COMMENT_PAGES = 3;
/** 每次請求之間的間隔毫秒，避免打太快 */
const DELAY = 700;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 讀 video-ids.txt，跳過空行與 # 註解（註解掉的是人工排除的非歌回影片） */
function idsFromList() {
  return fs
    .readFileSync(path.join(HERE, "video-ids.txt"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

/** 遞迴找留言區的初始 continuation token */
function findCommentSectionToken(node) {
  if (!node || typeof node !== "object") return null;
  if (node.itemSectionRenderer?.sectionIdentifier === "comment-item-section") {
    const t =
      node.itemSectionRenderer.contents?.[0]?.continuationItemRenderer
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
 * 找「下一頁留言」的 token。
 * 不能用遞迴亂找：展開回覆的 continuationItemRenderer 長得一模一樣（trigger 也是
 * ON_ITEM_SHOWN），深度優先會先撞到它，翻頁就變成翻某一串的回覆。
 * 正確位置固定是留言列表（BODY slot / append）的最後一個 item。
 */
function findNextPageToken(page) {
  for (const ep of page.onResponseReceivedEndpoints ?? []) {
    const reload = ep.reloadContinuationItemsCommand;
    const items =
      reload?.slot === "RELOAD_CONTINUATION_SLOT_BODY"
        ? reload.continuationItems
        : ep.appendContinuationItemsAction?.continuationItems;
    if (!items?.length) continue;
    const token =
      items[items.length - 1]?.continuationItemRenderer?.continuationEndpoint
        ?.continuationCommand?.token;
    if (token) return token;
  }
  return null;
}

const yt = await Innertube.create({
  lang: "ja",
  location: "JP",
  retrieve_player: false,
});

const rawNext = async (payload) => {
  const res = await yt.actions.execute("/next", { ...payload, parse: false });
  return res.data ?? res;
};

async function fetchComments(id) {
  const watch = await rawNext({ videoId: id });
  let token = findCommentSectionToken(watch);
  const out = [];

  for (let i = 0; i < COMMENT_PAGES && token; i++) {
    await sleep(DELAY);
    const page = await rawNext({ continuation: token });
    const mutations = page.frameworkUpdates?.entityBatchUpdate?.mutations ?? [];
    for (const m of mutations) {
      const p = m.payload?.commentEntityPayload;
      if (!p) continue;
      // replyLevel 0 = 頂層留言，回覆不要
      if (p.properties?.replyLevel) continue;
      out.push({
        author: p.author?.displayName ?? "",
        likes: p.toolbar?.likeCountNotliked ?? null,
        publishedTime: p.properties?.publishedTime ?? "",
        text: p.properties?.content?.content ?? "",
      });
    }
    token = findNextPageToken(page);
  }
  return out;
}

async function fetchOne(id) {
  const info = await yt.getInfo(id);
  const comments = await fetchComments(id);
  return {
    id,
    title: info.basic_info.title ?? "",
    durationSec: info.basic_info.duration ?? null,
    isLiveContent: Boolean(info.basic_info.is_live_content),
    description: info.basic_info.short_description ?? "",
    commentCount: comments.length,
    comments,
  };
}

fs.mkdirSync(DATA_DIR, { recursive: true });

const args = process.argv.slice(2);
const ids = args.length > 0 ? args : idsFromList();
console.log(`目標 ${ids.length} 部影片`);

const failed = [];
let done = 0;
let skipped = 0;

for (const id of ids) {
  const out = path.join(DATA_DIR, `${id}.json`);
  if (args.length === 0 && fs.existsSync(out)) {
    skipped++;
    continue;
  }
  try {
    const data = await fetchOne(id);
    fs.writeFileSync(out, JSON.stringify(data, null, 2));
    done++;
    console.log(
      `[${done + skipped}/${ids.length}] ${id} 留言 ${data.commentCount} 則 — ${data.title.slice(0, 40)}`,
    );
  } catch (err) {
    failed.push({ id, error: String(err?.message ?? err) });
    console.error(`[!] ${id} 失敗：${err?.message ?? err}`);
  }
  await sleep(DELAY);
}

console.log(`\n完成 ${done} 部，跳過 ${skipped} 部，失敗 ${failed.length} 部`);
if (failed.length > 0) {
  fs.writeFileSync(path.join(HERE, "_failed-fetches.json"), JSON.stringify(failed, null, 2));
  console.log("失敗清單：test/_failed-fetches.json");
}
