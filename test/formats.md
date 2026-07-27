# Setlist 格式盤點

資料來源：[video-ids.txt](video-ids.txt) 的 143 部影片，
用 [fetch-video-data.mjs](fetch-video-data.mjs) 抓下說明欄與前 60 則留言，
再用 [analyze-setlists.mjs](analyze-setlists.mjs) 判讀，共 3334 行時間戳。

## 命中率

| | 部數 |
|---|---|
| 留言有 setlist | 143 / 143 |
| 說明欄有 setlist | 33 / 143（全部同時也有留言版） |
| 兩者皆無 | 0 |

**留言是唯一可靠來源** —— 每一部都找得到，而說明欄從來不是唯一來源。

收錄標準是「有沒有帶時間戳的 setlist」，不是「是不是歌枠」：
`aO2aIZE9UOM` 是合作企劃不是歌枠，但留言有 27 首的 setlist，一樣納入測試。

setlist 通常是直播結束後才由觀眾補在留言，所以**抓取時機會影響結果**：
`zVxGPtUNiTw` 第一次抓時還在直播中（時長為 null、無 setlist），重抓才有。
判斷「這部真的沒有 setlist」之前，先確認 `durationSec` 不是 null。
尚未開播的影片（如 `N-rR_HhJfeo`）在 video-ids.txt 裡先註解掉，開完再取消註解重抓。

## 排版形式

| 形式 | 部數 | 代表影片 |
|---|---|---|
| 單行（時間與歌名同一行） | 139 | `eRKGvuQK-7U` |
| 多行－歌名在時間下一行 | 2 | `3__2Vow7eiQ`、`vVau20_T6WM` |
| 多行－歌名在時間上一行 | 0 | 未出現 |
| 混合（同一份裡兩種都有） | 2 | `De5LXMx-lqE`、`zAqcZDpOM1Q` |

多行版兩部都是松永依織頻道，且時間戳是**區間**寫法：

```
１ 10:30~14:43
└ Mela!! / 緑黄色社会 (Ryokuoushoku Shakai) 🤍
```

## 現行 parser 會漏掉的變化

[chapterParser.ts:10](../src/chapterParser.ts#L10) 的 `TIMESTAMP_START_RE` 要求時間戳在行首，
但 **27 / 143 部（19%）的時間戳前面有編號**，這些會整批解析失敗：

| 前綴樣式 | 例子 | 代表影片 |
|---|---|---|
| `01.` 兩位數加點 | `01.    00:02:23    君と夏フェス  /  SHISHAMO` | `02pr8P_jjPg` |
| `01. ` ＋`～`分隔 | `01. 0:09:28 ～ 打上花火／DAOKO×米津玄師` | `O2k2EupPzLs` |
| `①`～`㊵` 圈號 | `①01:45 残響散歌 / Aimer『鬼滅の刃』` | `41FplBpe3sM` |
| `1  . ` 數字加空格點 | `1  . 03:54 Empty Town` | `zAqcZDpOM1Q` |
| `１ ` 全形數字（多行版） | `１ 4:55~7:52` | `3__2Vow7eiQ` |
| `└` `├` 樹狀符號 | `└ ロキ / Loki (みきとP)` | `vVau20_T6WM` |

完整 27 部清單：開 [candidates.html](candidates.html) 按「時間戳非行首」篩選。

## 其他要處理的細節

- **時間格式**：`hh:mm:ss` 2886 行、`mm:ss` 448 行。12 部影片整份 setlist 只用 `mm:ss`
  （多為 30 分鐘的接力企劃），現行 parser 兩種都吃，沒問題。
- **分隔符**：半形空白最多（1905），全形空白 661，多重空白 297，另有 ` ～ `（53）、`~`、` - `。
  現行 `SEPARATOR_RE` 沒有涵蓋全形空白 `　` 與 `～`。
- **YouTube 自訂表情**：留言常夾雜 `:_penlight:`、`:_thankgod:` 這種 shortcode，
  會混進歌名（例：`17:33     IRIS OUT:_thankgod:`），需要清掉。
- **區間時間戳**：`4:55~7:52` 一行兩個時間戳，取第一個即可，但不能讓第二個被當成歌名。
- **長度**：28 部的 setlist 超過 40 首，最長 72 首，抓留言時分頁不能只抓一頁。
- **同標題不同影片**：`ljWlIgFIS1Y` 與 `O2k2EupPzLs` 是同一位直播主同日因斷線重開的兩場，
  標題完全相同但內容不同（5978s / 13 首、4367s / 7 首）。一律以 videoId 為鍵，不可依標題去重。
