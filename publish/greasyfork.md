# Greasy Fork 上架資訊

> ✅ **已上架**（首發版本 **0.2.0**，2026-08-01）
> 腳本頁面：<https://greasyfork.org/zh-TW/scripts/589468-youtube-setlist-to-chapters>
> 安裝網址：<https://update.greasyfork.org/scripts/589468/YouTube%20Setlist%20to%20Chapters.user.js>
> 腳本 ID：`589468`
> 對應建置：`npm run build-prod-gf` → `dist/YouTubeSetlist2Chapters_gf.user.js`
>
> 之後每次更新版本：於腳本頁面的「更新程式碼」貼上新的 gf 建置，並填第 5 節的版本說明。

---

## 0. 上架前準備（每次更新版本沿用）

- [ ] 確認 `package.json` 的 `version` 是要發佈的版本（目前 **0.2.0**）
- [ ] 重新執行 `npm run build-prod-gf`（`dist/` 內現有檔案的 build number 停在舊 commit，且 header 內的 icon URL 帶 commit SHA）
- [ ] `npm run lint` 通過
- [ ] 確認 `main` 分支已推上 GitHub —— header 內的 `@icon` / `@resource` 都指向 `raw.githubusercontent.com/nathan60107/YoutubeSetlist2Chapters/main/assets/icon.svg`，沒推上去圖示會 404

> **關於 `@downloadURL` / `@updateURL`**：gf 版建置刻意不輸出這兩個 key。Greasy Fork 官方說明明確指出會移除它們——
> 「Greasy Fork will strip these keys, which makes any script installed from Greasy Fork only update from Greasy Fork」——
> 並在提供下載時注入自己的版本。上架後實地驗證過，安裝檔的 header 帶的是 gf 自己的：
> `@downloadURL https://update.greasyfork.org/scripts/589468/YouTube%20Setlist%20to%20Chapters.user.js`、
> `@updateURL https://update.greasyfork.org/scripts/589468/YouTube%20Setlist%20to%20Chapters.meta.js`。

---

## 1. 表單欄位對應

Greasy Fork 的**名稱、描述、適用網站、授權**都直接從中繼資料（metadata block）讀取，表單上不需要另外填。以下為對應值：

| 項目 | 值 | 來源 |
|------|-----|------|
| Name | `YouTube Setlist to Chapters` | `@name`（另有 9 種語言的 `@name:<code>`，來源 `assets/meta-i18n.json`） |
| Description | `Converts YouTube comment setlists into chapter markers on the YouTube player progress bar` | `@description`（另有 9 種語言） |
| Version | `0.2.0` | `@version` |
| License | `MIT` | `@license` |
| Applies to | `youtube.com` | `@match` |
| Script language | JavaScript | — |
| Additional info | 見下方第 2、3、4 節（英文為主要語言，另新增「中文（正體）」與「日本語」各一份） | — |

實際貼上的原始碼：`dist/YouTubeSetlist2Chapters_gf.user.js` 全文。

本地化名稱確認生效：`greasyfork.org/zh-TW/...` 顯示的是「YouTube 留言曲目單轉章節」而非英文原名。

### Greasy Fork 規則自查

- 程式碼未混淆、未壓縮（build 沒有經過 terser，1.4 MB／約 3.3 萬行，平均每行約 44 字元）✅
- `youtubei.js` 是 bundle 進去的，不是 `@require` —— 屬於隨腳本一起提交的第三方原始碼，未壓縮 ✅
- 唯一的 `@require` 來自 `cdn.jsdelivr.net/npm/@sv443-network/userutils@6.3.0`，屬 Greasy Fork 允許的 CDN ✅
- 無廣告、無聯盟連結、無追蹤 ✅
- `@license MIT` 已標示 ✅

---

## 2. Additional info（English，主要語言）

```markdown
**YouTube Setlist to Chapters** turns the setlist someone posted in the comments into chapter markers on the YouTube progress bar.

Singing streams and concerts almost never come with chapters, but there is nearly always a comment listing every song and the time it starts. This script finds that comment and draws it onto the progress bar, so you can see where each song sits and jump straight to the one you want.

## Features

- **Nothing to set up** — open a video and the chapters appear on their own; no account, no API key, no payment
- **Finds the setlist in the comments** — the comment section is scanned and the one that best looks like a setlist is used, so videos the uploader never added chapters to work too
- **Supports every format** — timestamps in any common form (`0:00`, `00:00`, `0:00:00`), ranges such as `4:55~7:52`, songs numbered `01.`, `①` or `１`, the timestamp placed anywhere on the line, and setlists that put the song name on the line below its timestamp
- **Song names on hover** — point at a segment on the progress bar to see which song it is

## How to use

1. Install Tampermonkey, then install this script
2. Open a singing stream or concert on YouTube
3. Wait a moment — the comments are read and coloured segments appear on the progress bar, one per song
4. Point at a segment to see the song's name, and click it to jump there

If nothing appears, no comment on that video was recognised as a setlist.

## Requirements

- Tampermonkey, or another userscript manager
- Nothing else — no account, no API key, no payment

## Privacy

- No data collection, no analytics, no server of the author's involved
- Comments are read from YouTube itself (same-origin requests from the page); nothing leaves your browser
- Settings are stored locally by your userscript manager

## Source & support

- Source code: https://github.com/nathan60107/YoutubeSetlist2Chapters
- Bug reports & feature requests: https://github.com/nathan60107/YoutubeSetlist2Chapters/issues
- License: MIT
```

---

## 3. Additional info（中文（正體））

```markdown
**YouTube Setlist to Chapters** 會把留言區裡的曲目單，變成 YouTube 進度條上的章節標記。

歌回與演唱會幾乎都沒有章節，但留言區幾乎一定有人整理好每首歌與它的開始時間。這個腳本會找出那則留言，把它畫在進度條上，讓你一眼看出每首歌的位置，想聽哪首就直接跳過去。

## 功能特色

- **不用設定** — 打開影片，章節就自己出現；不需帳號、不需 API 金鑰、不必付費
- **從留言自動找出曲目單** — 掃過留言區選出最像曲目單的一則，上傳者沒有加章節的影片也適用
- **支援各種格式** — 各種常見的時間格式（`0:00`、`00:00`、`0:00:00`）、`4:55~7:52` 這種區間、`01.`、`①`、`１` 等編號、時間戳寫在行內任何位置，以及把歌名寫在時間戳下一行的排版
- **滑過就看到歌名** — 滑鼠移到進度條上的區段，就會顯示那是哪一首

## 使用方式

1. 安裝 Tampermonkey，再安裝本腳本
2. 在 YouTube 打開歌回或演唱會
3. 稍等一下 —— 腳本讀完留言後，進度條上會出現一段一段的彩色區段，一首歌一段
4. 滑鼠移到區段上會顯示歌名，點下去就跳到那首

如果什麼都沒出現，代表那部影片沒有留言被判定為曲目單。

## 使用需求

- Tampermonkey 或其他使用者腳本管理器
- 其他都不需要 —— 不必註冊、不需 API 金鑰、不必付費

## 隱私

- 不蒐集任何資料、無分析追蹤、不經過作者的任何伺服器
- 留言由 YouTube 本身讀取（頁面內的同源請求），沒有任何資料離開你的瀏覽器
- 設定值由你的使用者腳本管理器儲存在本機

## 原始碼與支援

- 原始碼：https://github.com/nathan60107/YoutubeSetlist2Chapters
- 問題回報與功能建議：https://github.com/nathan60107/YoutubeSetlist2Chapters/issues
- 授權：MIT
```

---

## 4. Additional info（日本語）

```markdown
**YouTube Setlist to Chapters** は、コメント欄に投稿されたセットリストを YouTube のプログレスバー上のチャプターに変えるツールです。

歌枠・ライブにはチャプターがほとんど付いていませんが、コメント欄にはたいてい曲名と開始時刻を書き出してくれた人がいます。このスクリプトはそのコメントを見つけてプログレスバーに描き込むので、どの曲がどこにあるのかが一目で分かり、聴きたい曲へそのまま飛べます。

## 機能

- **設定不要** — 動画を開けばチャプターが勝手に現れます。アカウントも API キーも料金も不要
- **コメントからセットリストを自動で探す** — コメント欄を調べて最もセットリストらしいものを選ぶので、投稿者がチャプターを付けていない動画でも使えます
- **さまざまな書式に対応** — よくあるタイムスタンプ形式（`0:00`、`00:00`、`0:00:00`）、`4:55~7:52` のような区間表記、`01.`・`①`・`１` などの番号、行内のどこに置かれたタイムスタンプ、曲名がタイムスタンプの次の行に書かれたレイアウト
- **カーソルを乗せれば曲名** — プログレスバー上の区間にカーソルを合わせると、その曲名が表示されます

## 使い方

1. Tampermonkey を入れてから、このスクリプトを入れます
2. YouTube で歌枠・ライブを開きます
3. 少し待つと、コメントが読み込まれてプログレスバーに 1 曲ずつ色付きの区間が現れます
4. 区間にカーソルを合わせると曲名が表示され、クリックするとその曲へ飛びます

何も出ない場合は、その動画のコメントにセットリストと判定できるものが無かったということです。

## 動作要件

- Tampermonkey、または他のユーザースクリプトマネージャー
- それ以外は不要 —— アカウントも API キーも料金もいりません

## プライバシー

- データ収集なし、解析なし、作者のサーバーは一切介在しません
- コメントは YouTube 自身から読み取ります（ページ内の同一オリジンリクエスト）。ブラウザの外へ出るデータはありません
- 設定はユーザースクリプトマネージャーがローカルに保存します

## ソースコードとサポート

- ソースコード: https://github.com/nathan60107/YoutubeSetlist2Chapters
- 不具合報告・機能要望: https://github.com/nathan60107/YoutubeSetlist2Chapters/issues
- ライセンス: MIT
```

---

## 5. 版本說明（Notes on this version）

首次上架已填：`Initial release on Greasy Fork (v0.2.0).`

之後每次更新，從 [changelog.md](../changelog.md) 取對應版本的條列貼上即可。

---

## 6. 上架後待辦

- [x] 記下腳本頁面網址，回填本檔開頭
- [x] 確認安裝檔內是 Greasy Fork 自己注入的 `@downloadURL` / `@updateURL`（下載安裝檔檢查 header）
- [x] 更新 [README.md](../README.md)、[README.zh-TW.md](../README.zh-TW.md)、[README.ja.md](../README.ja.md)「步驟 2」的安裝連結
