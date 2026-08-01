# GitHub 上架資訊（Repository + Release）

> 平台：<https://github.com/nathan60107/YoutubeSetlist2Chapters>
> 最新 release：**v0.2.0**（2026-08-01）<https://github.com/nathan60107/YoutubeSetlist2Chapters/releases/tag/v0.2.0>
> 對應建置：`npm run build-prod-gh` → `dist/YouTubeSetlist2Chapters.user.js`
> 這是「直接從 GitHub 安裝」的通道，同時也是 Greasy Fork 版的原始碼與問題回報來源。
>
> **兩個建置中只有這一個帶 `@downloadURL` / `@updateURL`**（指向 `raw.githubusercontent.com/.../main/dist/YouTubeSetlist2Chapters.user.js`）：
> raw 檔案與 release 附件本身不帶任何更新來源，所以必須寫明；Greasy Fork 會自行注入（已於上架後驗證，見 [greasyfork.md](greasyfork.md)），gf 版建置因此刻意不輸出這兩個 key。

---

## 0. 上架前準備

- [ ] 確認 `package.json` 的 `version` 是要發佈的版本（目前 **0.2.0**）
- [ ] 執行 `npm run build-prod`（一次產出 gh / gf 兩個檔案）
- [ ] `npm run lint` 通過
- [ ] `npm test` 通過（143 部影片的解析回歸測試）
- [ ] `dist/*.user.js` 兩個檔案已 commit 並推上 `main`（`.gitignore` 已設定為只追蹤 `dist/*.user.js`）—— GitHub 安裝連結直接讀 `main` 上的這個檔案，沒推上去就等於沒發佈
- [ ] 新的 tag 尚未存在（`git tag` 確認），且 `main` 已推上去 —— tag 是以 `main` 當時的 HEAD 為準

---

## 1. Repository 設定（About 區塊）

| 欄位 | 值 |
|------|-----|
| Description | `Converts YouTube comment setlists into chapter markers on the YouTube player progress bar` |
| Topics | 見下方 |

Website 欄位留空：之後還打算做瀏覽器擴充元件版本，屆時再決定要指向哪裡。

Topics（複製貼上，GitHub 上以空白分隔輸入）：

```
userscript tampermonkey violentmonkey youtube setlist chapters concert live-music youtube-comments greasyfork typescript
```

---

## 2. Release

| 欄位 | 值 |
|------|-----|
| Tag | `v0.2.0`（target: `main`） |
| Release title | `v0.2.0 - First public release` |
| Set as latest release | ✅ |
| Attachments | `dist/YouTubeSetlist2Chapters.user.js`、`dist/YouTubeSetlist2Chapters_gf.user.js` |

### Release notes（直接貼上）

```markdown
First public release of **YouTube Setlist to Chapters** — it turns the setlist someone posted in the comments into chapter markers on the YouTube progress bar.

Singing streams and concerts almost never come with chapters, but there is nearly always a comment listing every song and the time it starts. This script finds that comment and draws it onto the progress bar.

## Install

| Platform | Link |
|----------|------|
| Greasy Fork | https://greasyfork.org/scripts/589468-youtube-setlist-to-chapters |
| Direct from this repo | https://raw.githubusercontent.com/nathan60107/YoutubeSetlist2Chapters/main/dist/YouTubeSetlist2Chapters.user.js |

Requires Tampermonkey (or another userscript manager). Nothing else — no account, no API key, no payment.

## Highlights

- **Nothing to set up** — open a video and the chapters appear on their own
- **Finds the setlist in the comments** — the comment section is scanned and the one that best looks like a setlist is used, so videos the uploader never added chapters to work too
- **Supports every format** — `0:00` / `00:00` / `0:00:00`, ranges like `4:55~7:52`, songs numbered `01.`, `①` or `１`, the timestamp anywhere on the line, and song names written on the line below their timestamp
- **Song names on hover** — point at a segment on the progress bar to see which song it is

Full history: [changelog.md](https://github.com/nathan60107/YoutubeSetlist2Chapters/blob/main/changelog.md)
```

### 用 gh CLI 建立

```bash
gh release create v0.2.0 \
  dist/YouTubeSetlist2Chapters.user.js \
  dist/YouTubeSetlist2Chapters_gf.user.js \
  --title "v0.2.0 - First public release" \
  --notes-file <上面 release notes 另存的檔案> \
  --latest
```

先把上面那段 release notes 另存成暫存 md 檔再以 `--notes-file` 帶入（避免 shell 對 markdown 的跳脫問題）。
標題使用 ASCII `-` 而非 em dash，PowerShell 傳遞非 ASCII 參數容易編碼出錯。

---

## 3. 上架後待辦

- [x] Release notes 的 Greasy Fork 那一列補上實際連結
- [x] v0.2.0 已發佈：tag 指向 `4de05f5`，兩個 `.user.js` 皆已附加，設為 latest
- [ ] 後續每次發版：更新 `package.json` 版本 → `npm run build-prod` → 更新 `changelog.md` → commit + push → 開 tag/release → 更新 Greasy Fork 上的原始碼
