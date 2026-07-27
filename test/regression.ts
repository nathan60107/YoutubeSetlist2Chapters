/**
 * 用 test/data/ 的固定資料跑回歸測試。
 *
 *   npm test                              # 對照 baseline.json，退步就 exit 1
 *   npm test -- --update-baseline         # 改善之後更新基準（退步時會拒絕）
 *   npm test -- --update-baseline --force # 資料集變動導致退步時，確認後強制更新
 *   npm test -- --list-failures           # 印出解析失敗的影片與原因
 *
 * 量兩件事：
 *   1. commentFinder 有沒有從幾十則留言裡挑中那則 setlist
 *   2. chapterParser 能從挑中的留言解析出多少章節
 *
 * 期望值來自 test/_analysis.json（由 analyze-setlists.mjs 產生），
 * 那份是人工抽樣核對過的 setlist 判讀結果。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { activeChapterParseStrategy } from "../src/chapterParser.js";
import { activeCommentFindStrategy, countTimestamps } from "../src/commentFinder.js";
import type { CommentCandidate } from "../src/types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "data");
const BASELINE = join(HERE, "baseline.json");

/** test/data/<videoId>.json 裡本測試用得到的欄位 */
type Fixture = {
  id: string;
  title: string;
  comments: { text: string }[];
};

/** test/_analysis.json 裡本測試用得到的欄位 */
type Analysis = {
  id: string;
  comment: { count: number; text: string } | null;
};

type Metrics = {
  videos: number;
  /** 有 setlist 可供比對的影片數 */
  withSetlist: number;
  /** commentFinder 挑中正確留言 */
  commentPicked: number;
  /** 解析出的章節數 >= 期望的 90% */
  fullyParsed: number;
  /** 解析出 1 個以上章節但不足 90% */
  partiallyParsed: number;
  /** 一個章節都解析不出來 */
  failed: number;
};

const analysisPath = join(HERE, "_analysis.json");
if (!existsSync(analysisPath)) {
  console.error("找不到 test/_analysis.json，請先執行 node test/analyze-setlists.mjs");
  process.exit(1);
}

const analysis: Analysis[] = JSON.parse(readFileSync(analysisPath, "utf8"));
const expectedById = new Map(analysis.map((a) => [a.id, a]));

/** data/ 只放影片資料，檔名一律是 11 碼 videoId（可能以底線或連字號開頭） */
const files = readdirSync(DATA_DIR).filter((f) => /^[\w-]{11}\.json$/.test(f));

const metrics: Metrics = {
  videos: 0,
  withSetlist: 0,
  commentPicked: 0,
  fullyParsed: 0,
  partiallyParsed: 0,
  failed: 0,
};

type Failure = {
  id: string;
  title: string;
  reason: string;
  expected: number;
  got: number;
  sample: string;
};
const failures: Failure[] = [];

for (const file of files) {
  const fx: Fixture = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  metrics.videos++;

  const expected = expectedById.get(fx.id);
  if (!expected?.comment) continue; // 這部影片本來就沒有 setlist 留言
  metrics.withSetlist++;

  const candidates: CommentCandidate[] = fx.comments.map((c, i) => ({
    id: `${fx.id}#${i}`,
    text: c.text,
    timestampCount: countTimestamps(c.text),
  }));

  const picked = activeCommentFindStrategy.find(candidates);
  const pickedRight = picked?.text === expected.comment.text;
  if (pickedRight) metrics.commentPicked++;

  const source = picked?.text ?? "";
  const chapters = source
    .split(/\r?\n/)
    .map((line) => activeChapterParseStrategy.parseLine(line))
    .filter((c) => c !== null);

  const target = expected.comment.count;
  const ratio = target === 0 ? 0 : chapters.length / target;

  if (chapters.length === 0) {
    metrics.failed++;
  } else if (ratio >= 0.9) {
    metrics.fullyParsed++;
    continue;
  } else {
    metrics.partiallyParsed++;
  }

  failures.push({
    id: fx.id,
    title: fx.title.slice(0, 40),
    reason: !pickedRight ? "選錯留言" : chapters.length === 0 ? "完全無法解析" : "只解析出部分",
    expected: target,
    got: chapters.length,
    sample: (source.split(/\r?\n/).find((l) => /\d{1,2}:\d{2}/.test(l)) ?? "").slice(0, 60),
  });
}

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(1)}%`;

console.log(`影片數：${metrics.videos}（其中 ${metrics.withSetlist} 部有 setlist 留言）`);
console.log(`commentFinder 挑中正確留言：${metrics.commentPicked} / ${metrics.withSetlist}  ${pct(metrics.commentPicked, metrics.withSetlist)}`);
console.log(`chapterParser 完整解析：    ${metrics.fullyParsed} / ${metrics.withSetlist}  ${pct(metrics.fullyParsed, metrics.withSetlist)}`);
console.log(`             部分解析：    ${metrics.partiallyParsed}`);
console.log(`             完全失敗：    ${metrics.failed}`);

if (process.argv.includes("--list-failures")) {
  console.log("\n--- 未完整解析的影片 ---");
  for (const f of failures) {
    console.log(`${f.id}  ${f.reason}  ${f.got}/${f.expected}  ${f.title}`);
    console.log(`   例：${f.sample}`);
  }
}

/** 與基準比較：越高越好的指標退步、越低越好的指標變差，都算 regression */
function compare(base: Metrics) {
  const regressions: string[] = [];
  const improvements: string[] = [];
  for (const key of ["commentPicked", "fullyParsed"] as const) {
    if (metrics[key] < base[key]) regressions.push(`${key}: ${base[key]} → ${metrics[key]}`);
    else if (metrics[key] > base[key]) improvements.push(`${key}: ${base[key]} → ${metrics[key]}`);
  }
  for (const key of ["failed", "partiallyParsed"] as const) {
    if (metrics[key] > base[key]) regressions.push(`${key}: ${base[key]} → ${metrics[key]}`);
    else if (metrics[key] < base[key]) improvements.push(`${key}: ${base[key]} → ${metrics[key]}`);
  }
  return { regressions, improvements };
}

if (process.argv.includes("--update-baseline")) {
  /*
   * 護欄一：掃不到固定資料就絕不寫入。全 0 的基準會讓之後每一次執行都「沒有退步」，
   * 等於把測試靜靜關掉 —— 這比測試失敗危險得多。
   */
  if (metrics.withSetlist === 0) {
    console.error("\n拒絕更新基準：test/data/ 掃不到任何有 setlist 的影片。");
    console.error("請先確認 test/data/*.json 與 test/_analysis.json 都在，再重跑。");
    process.exit(1);
  }

  const force = process.argv.includes("--force");
  if (existsSync(BASELINE)) {
    const base: Metrics = JSON.parse(readFileSync(BASELINE, "utf8"));
    const { regressions, improvements } = compare(base);

    // 護欄二：指標退步時要明確加 --force，避免把壞掉的結果寫成新基準
    if (regressions.length > 0 && !force) {
      console.error(`\n拒絕更新基準，指標退步：${regressions.join("、")}`);
      console.error("若這是預期內的變動（例如新增了已知失敗的影片），請加 --force：");
      console.error("  npm test -- --update-baseline --force");
      process.exit(1);
    }
    if (improvements.length > 0) console.log(`\n改善：${improvements.join("、")}`);
    if (regressions.length > 0) console.log(`退步（--force 已略過）：${regressions.join("、")}`);
    if (improvements.length === 0 && regressions.length === 0) console.log("\n指標與基準相同");
  }

  writeFileSync(BASELINE, JSON.stringify(metrics, null, 2) + "\n");
  console.log("已更新 test/baseline.json");
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.log("\n尚無 baseline，請執行 npm test -- --update-baseline 建立基準");
  process.exit(0);
}

const { regressions, improvements } = compare(JSON.parse(readFileSync(BASELINE, "utf8")));

if (improvements.length > 0) console.log(`\n改善：${improvements.join("、")}`);
if (regressions.length > 0) {
  console.error(`\n退步：${regressions.join("、")}`);
  process.exit(1);
}
console.log("\n沒有退步 ✓");
