/**
 * 掃過 test/data/*.json，判斷每部影片的 setlist 出現在留言還是說明欄、以及排版形式。
 *
 *   node test/analyze-setlists.mjs              # 輸出統計，結果寫進 test/_analysis.json
 *   node test/analyze-setlists.mjs --dump <id>  # 印出某部影片的最佳候選原文
 *
 * test/data/ 只放影片資料，檔名一律是 <videoId>.json；產生物一律放在 test/ 底下，並以底線開頭凸顯。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, "data");
/** videoId 是 11 個字元的 [A-Za-z0-9_-]，可能以底線或連字號開頭 */
const VIDEO_FILE_RE = /^[\w-]{11}\.json$/;

const TIMESTAMP_RE = /(\d{1,3}):([0-5]?\d)(?::([0-5]\d))?/g;

function toSec(h, m, s) {
  return s === undefined
    ? Number(h) * 60 + Number(m)
    : Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/** 抽出每一行的時間戳（只取該行第一個） */
function scanLines(text) {
  return text.split(/\r?\n/).map((line, i) => {
    TIMESTAMP_RE.lastIndex = 0;
    const m = TIMESTAMP_RE.exec(line);
    return {
      i,
      line,
      raw: m?.[0] ?? null,
      sec: m ? toSec(m[1], m[2], m[3]) : null,
    };
  });
}

/**
 * 判斷這段文字是不是 setlist。
 * 時間表／告知也會有一堆時間戳（例如接力企劃的 18:30 ✦ 開会式），
 * 用「時間戳遞增」＋「不超過影片長度」把它們濾掉。
 */
function evaluate(text, durationSec) {
  const rows = scanLines(text);
  const stamped = rows.filter((r) => r.sec !== null);
  if (stamped.length < 3) return null;

  const inRange = durationSec
    ? stamped.filter((r) => r.sec <= durationSec * 1.02)
    : stamped;
  if (inRange.length < 3) return null;

  let increasing = 1;
  for (let i = 1; i < inRange.length; i++) {
    if (inRange[i].sec >= inRange[i - 1].sec) increasing++;
  }
  const monotonicRatio = increasing / inRange.length;
  if (monotonicRatio < 0.8) return null;

  return { rows, stamped: inRange, count: inRange.length };
}

/**
 * 這一行除了時間戳與編號之外，還有沒有真正的歌名文字。
 * 必須扣掉「整行所有」時間戳：`１ 4:55~7:52` 這種區間寫法只扣第一個的話，
 * 殘留的 7:52 會被誤判成歌名。編號（01. / ① / 【1】）也不算文字，
 * 所以只數字母／假名／漢字。
 */
function hasTitleText(line) {
  const stripped = line.replace(/(\d{1,3}):([0-5]?\d)(?::([0-5]\d))?/g, " ");
  return (stripped.match(/\p{L}/gu) ?? []).length >= 2;
}

/** 判斷排版形式：單行 / 多行-下（歌名在時間下一行）/ 多行-上 */
function detectShape(ev) {
  const { rows, stamped } = ev;
  const nonEmpty = (idx) => rows[idx] && rows[idx].line.trim() !== "";
  let inline = 0;
  let below = 0;
  let above = 0;

  for (const r of stamped) {
    if (hasTitleText(r.line)) {
      inline++;
      continue;
    }
    // 只有時間戳的行：歌名在上一行還是下一行？
    const nextIsPlain = nonEmpty(r.i + 1) && hasTitleText(rows[r.i + 1].line);
    const prevIsPlain = nonEmpty(r.i - 1) && hasTitleText(rows[r.i - 1].line);
    if (nextIsPlain && !prevIsPlain) below++;
    else if (prevIsPlain && !nextIsPlain) above++;
    else if (nextIsPlain) below++;
    else if (prevIsPlain) above++;
  }

  const total = inline + below + above;
  if (total === 0) return "不明";
  const top = Math.max(inline, below, above);
  const label = top === inline ? "單行" : top === below ? "多行-下" : "多行-上";
  return top / total >= 0.8 ? label : `混合(單${inline}/下${below}/上${above})`;
}

/** 時間戳是不是都在行首（現行 parser 的假設） */
function startsAtLineHead(ev) {
  const heads = ev.stamped.filter((r) => r.line.trimStart().indexOf(r.raw) === 0);
  return heads.length / ev.stamped.length >= 0.8;
}

const files = fs
  .readdirSync(DATA_DIR)
  .filter((f) => VIDEO_FILE_RE.test(f));

const results = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
  const dur = d.durationSec;

  const descEv = evaluate(d.description, dur);

  let bestComment = null;
  let bestEv = null;
  for (const c of d.comments) {
    const ev = evaluate(c.text, dur);
    if (ev && (!bestEv || ev.count > bestEv.count)) {
      bestEv = ev;
      bestComment = c;
    }
  }

  results.push({
    id: d.id,
    title: d.title,
    durationSec: dur,
    desc: descEv && {
      count: descEv.count,
      shape: detectShape(descEv),
      lineHead: startsAtLineHead(descEv),
      text: d.description,
    },
    comment: bestEv && {
      count: bestEv.count,
      shape: detectShape(bestEv),
      lineHead: startsAtLineHead(bestEv),
      author: bestComment.author,
      likes: bestComment.likes,
      text: bestComment.text,
    },
  });
}

const dumpIdx = process.argv.indexOf("--dump");
if (dumpIdx !== -1) {
  const id = process.argv[dumpIdx + 1];
  const r = results.find((x) => x.id === id);
  if (!r) {
    console.error("找不到", id);
    process.exit(1);
  }
  console.log(r.title, `(${r.durationSec}s)`);
  console.log("=== 說明欄 ===", JSON.stringify(r.desc));
  console.log("=== 最佳留言 ===", JSON.stringify({ ...r.comment, text: undefined }));
  console.log(r.comment?.text ?? "(無)");
  process.exit(0);
}

const has = (r) => Boolean(r.comment) || Boolean(r.desc);
const tally = (fn) => {
  const m = new Map();
  for (const r of results) {
    const k = fn(r);
    if (k == null) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]);
};

console.log(`影片數：${results.length}`);
console.log(`有 setlist（留言或說明欄）：${results.filter(has).length}`);
console.log(`  留言有：${results.filter((r) => r.comment).length}`);
console.log(`  說明欄有：${results.filter((r) => r.desc).length}`);
console.log(`  兩者都有：${results.filter((r) => r.comment && r.desc).length}`);
console.log(`  兩者都沒有：${results.filter((r) => !has(r)).length}`);
console.log("\n留言 setlist 形式：");
for (const [k, v] of tally((r) => r.comment?.shape)) console.log(`  ${k}: ${v}`);
console.log("\n說明欄 setlist 形式：");
for (const [k, v] of tally((r) => r.desc?.shape)) console.log(`  ${k}: ${v}`);
console.log("\n時間戳在行首？（留言）");
for (const [k, v] of tally((r) => (r.comment ? String(r.comment.lineHead) : null)))
  console.log(`  ${k}: ${v}`);

fs.writeFileSync(
  path.join(HERE, "_analysis.json"),
  JSON.stringify(results, null, 2),
);
console.log("\n完整結果：test/_analysis.json");

/*
 * candidates.html 用的資料。寫成 .js 而不是 .json，是因為用 file:// 直接開網頁時
 * fetch() 讀本機檔案會被 CORS 擋掉，<script src> 則不會。
 */
const pageData = results.map((r) => {
  const fromComment = Boolean(r.comment);
  const src = r.comment ?? r.desc;
  return {
    id: r.id,
    title: r.title,
    durationSec: r.durationSec,
    hasSetlist: Boolean(src),
    source: fromComment ? "comment" : src ? "desc" : null,
    count: src?.count ?? 0,
    shape: src?.shape ?? null,
    lineHead: src?.lineHead ?? null,
    author: r.comment?.author ?? "",
    likes: r.comment?.likes ?? null,
    descCount: r.desc?.count ?? 0,
    text: src?.text ?? "",
  };
});

const pageDataPath = path.join(HERE, "_page-data.js");
fs.writeFileSync(
  pageDataPath,
  "/* 由 analyze-setlists.mjs 產生，勿手動編輯。供 test/candidates.html 使用。 */\n" +
    `window.SETLIST_DATA = ${JSON.stringify(pageData)};\n`,
);
console.log(`頁面資料：test/_page-data.js（${pageData.length} 部，${(fs.statSync(pageDataPath).size / 1024).toFixed(0)} KB）`);
