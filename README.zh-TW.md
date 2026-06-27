# YouTube Setlist to Chapters

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![zh-TW](https://img.shields.io/badge/lang-zh--TW-green.svg)](README.zh-TW.md)
[![ja](https://img.shields.io/badge/lang-ja-blue.svg)](README.ja.md)

---

**YouTube Setlist to Chapters** 是一款可作為 Tampermonkey / Violentmonkey userscript 或瀏覽器原生擴充套件安裝的工具。

它能自動偵測 YouTube 影片留言中的演出曲目單（setlist），並將時間戳與曲目名稱轉換為章節標記，顯示在 YouTube 播放器的進度條上，讓你在演唱會錄影、演奏會、串場 DJ set 等影片中，能夠輕鬆地跳轉到想要的曲目。

## 功能特色

- **自動偵測** — 自動分析留言，找出最適合的 setlist 留言
- **多格式解析** — 支援各種常見的 setlist 時間戳格式（`0:00`、`00:00`、`0:00:00` 等）
- **章節注入** — 將解析結果顯示為 YouTube 播放器進度條上的章節標記
- **手動選擇** — 在自動偵測不符合預期時，可手動指定特定留言
- **設定面板** — 提供自訂選項（自動/手動模式、顯示偏好等）

## 安裝方式

> 本專案目前仍在積極開發中，尚未提供正式安裝連結。

| 平台 | 連結 |
|------|------|
| GreasyFork（Tampermonkey / Violentmonkey） | 🚧 開發中 |
| OpenUserJS（Tampermonkey / Violentmonkey） | 🚧 開發中 |
| Firefox 附加元件 | 🚧 開發中 |
| Chrome 擴充功能 | 🚧 開發中 |

## 開發

```bash
# 安裝依賴
npm install

# 開發模式（含熱重載）
npm run dev

# 生產建置（三個平台）
npm run build-prod
```

## 授權

本專案採用 [MIT License](./LICENSE.txt)。
