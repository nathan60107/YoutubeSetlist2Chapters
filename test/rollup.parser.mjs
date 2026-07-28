/**
 * 把 src/chapterParser.ts 打包成 test/candidates.html 能用 <script> 直接載入的檔案。
 *
 *   npm run test-page
 *
 * candidates.html 是用 file:// 直接開的，所以不能用 <script type="module"> ——
 * 模組腳本在 file:// 下會被當成不透明來源擋掉（_page-data.js 寫成 .js 而不是 .json
 * 也是同一個原因）。傳統 <script> 沒有這個限制，於是這裡輸出 iife 並掛到全域。
 *
 * 產物 test/_parser.js 與 _page-data.js 一樣進版控，clone 下來就能直接開那頁。
 * npm test 會先跑一次這支，所以 parser 改了而產物沒跟上時，git 會直接顯示
 * test/_parser.js 有未提交的變動 —— 過期的抄本曾經把已修好的影片標成「完全失敗」，
 * 這一步就是要讓同樣的事沒辦法悄悄發生。
 */
import pluginTypeScript from "@rollup/plugin-typescript";
import typescript from "typescript";

export default {
  input: "src/chapterParser.ts",
  output: {
    file: "test/_parser.js",
    format: "iife",
    name: "CHAPTER_PARSER",
    banner: "/* 由 npm run test-page 從 src/chapterParser.ts 產生，勿手動編輯。供 test/candidates.html 使用。 */",
  },
  plugins: [
    pluginTypeScript({
      typescript,
      tsconfig: false,
      // 只收 parser 與它的型別，否則整個 src/ 都會被拉進來型別檢查，噴出無關的警告
      include: ["src/chapterParser.ts", "src/types.ts"],
      compilerOptions: { target: "es2020", module: "esnext", moduleResolution: "node", strict: true },
    }),
  ],
};
