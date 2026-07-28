/**
 * 依解析結果分類列出影片 ID，供人工目測挑片。判定邏輯與 regression.ts 一致。
 *
 *   npm run node-ts -- ./test/list-by-outcome.ts partial        # 印出清單與樣本行
 *   npm run node-ts -- ./test/list-by-outcome.ts failed --ids   # 只印 ID，方便導向檔案
 *
 * 分類：full = 解析出的章節數 >= 期望的 90%，partial = 有解析出但不足，failed = 一個都沒有。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { activeChapterParseStrategy } from "../src/chapterParser.js";
import { activeCommentFindStrategy, countTimestamps } from "../src/commentFinder.js";
import type { CommentCandidate } from "../src/types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, "data");

type Fixture = { id: string; title: string; comments: { text: string }[] };
type Analysis = { id: string; comment: { count: number; text: string } | null };

const want = process.argv[2] ?? "partial";
const analysis: Analysis[] = JSON.parse(readFileSync(join(HERE, "_analysis.json"), "utf8"));
const expectedById = new Map(analysis.map((a) => [a.id, a]));
const files = readdirSync(DATA_DIR).filter((f) => /^[\w-]{11}\.json$/.test(f));

const hits: { id: string; title: string; got: number; target: number; sample: string }[] = [];

for (const file of files) {
  const fx: Fixture = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  const expected = expectedById.get(fx.id);
  if (!expected?.comment) continue;

  const candidates: CommentCandidate[] = fx.comments.map((c, i) => ({
    id: `${fx.id}#${i}`,
    text: c.text,
    timestampCount: countTimestamps(c.text),
  }));

  const picked = activeCommentFindStrategy.find(candidates);
  const source = picked?.text ?? "";
  const chapters = source
    .split(/\r?\n/)
    .map((line) => activeChapterParseStrategy.parseLine(line))
    .filter((c) => c !== null);

  const target = expected.comment.count;
  const ratio = target === 0 ? 0 : chapters.length / target;
  const outcome = chapters.length === 0 ? "failed" : ratio >= 0.9 ? "full" : "partial";
  if (outcome !== want) continue;

  hits.push({
    id: fx.id,
    title: fx.title,
    got: chapters.length,
    target,
    sample: (source.split(/\r?\n/).find((l) => /\d{1,2}:\d{2}/.test(l)) ?? "").slice(0, 60),
  });
}

if (process.argv.includes("--ids")) {
  for (const h of hits) console.log(h.id);
} else {
  for (const h of hits)
    console.log(`${h.id}\t${h.got}/${h.target}\t${h.title.slice(0, 40)}\n\t↳ ${h.sample}`);
  console.error(`\n${want}：${hits.length} 部`);
}
