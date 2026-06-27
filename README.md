# YouTube Setlist to Chapters

**語言 / Language / 言語：**
[繁體中文](#繁體中文) | [English](#english) | [日本語](#日本語)

---

## 繁體中文

### 簡介

**YouTube Setlist to Chapters** 是一款可作為 Tampermonkey / Violentmonkey userscript 或瀏覽器原生擴充套件安裝的工具。

它能自動偵測 YouTube 影片留言中的演出曲目單（setlist），並將時間戳與曲目名稱轉換為 YouTube 的內建章節功能，讓你在演唱會錄影、演奏會、串場 DJ set 等影片中，能夠輕鬆地跳轉到想要的曲目。

### 功能特色

- **自動偵測** — 自動分析留言，找出最適合的 setlist 留言
- **多格式解析** — 支援各種常見的 setlist 時間戳格式（`0:00`、`00:00`、`0:00:00` 等）
- **章節注入** — 將解析結果顯示為 YouTube 播放器進度條上的章節標記
- **手動選擇** — 在自動偵測不符合預期時，可手動指定特定留言
- **設定面板** — 提供自訂選項（自動/手動模式、顯示偏好等）

### 安裝方式

> 本專案目前仍在積極開發中，尚未提供正式安裝連結。

| 平台 | 連結 |
|------|------|
| GreasyFork（Tampermonkey / Violentmonkey） | 🚧 開發中 |
| OpenUserJS（Tampermonkey / Violentmonkey） | 🚧 開發中 |
| Firefox 附加元件 | 🚧 開發中 |
| Chrome 擴充功能 | 🚧 開發中 |

### 開發

```bash
# 安裝依賴
npm install

# 開發模式（含熱重載）
npm run dev

# 生產建置（三個平台）
npm run build-prod
```

### 授權

本專案採用 [MIT License](./LICENSE.txt)。

---

## English

### About

**YouTube Setlist to Chapters** is a tool installable as a Tampermonkey / Violentmonkey userscript or a native browser extension.

It automatically detects concert setlists posted in YouTube video comments and converts their timestamps and song names into YouTube's built-in chapter navigation. This makes it easy to jump to any specific song in concert recordings, live performances, DJ sets, and similar videos.

### Features

- **Auto-detection** — Analyzes comments to find the best matching setlist
- **Multi-format parsing** — Supports common timestamp formats (`0:00`, `00:00`, `0:00:00`, etc.)
- **Chapter injection** — Displays parsed setlist as chapter markers on the YouTube player progress bar
- **Manual selection** — Lets you manually pick a comment when auto-detection falls short
- **Settings panel** — Customizable options (auto/manual mode, display preferences, etc.)

### Installation

> This project is currently under active development. Installation links will be added with the first release.

| Platform | Link |
|----------|------|
| GreasyFork (Tampermonkey / Violentmonkey) | 🚧 In Development |
| OpenUserJS (Tampermonkey / Violentmonkey) | 🚧 In Development |
| Firefox Add-on | 🚧 In Development |
| Chrome Extension | 🚧 In Development |

### Development

```bash
# Install dependencies
npm install

# Development mode with live reload
npm run dev

# Production build (all platforms)
npm run build-prod
```

### License

This project is licensed under the [MIT License](./LICENSE.txt).

---

## 日本語

### 概要

**YouTube Setlist to Chapters** は、Tampermonkey / Violentmonkey のユーザースクリプト、またはブラウザネイティブ拡張機能としてインストールできるツールです。

YouTubeの動画コメントに投稿されたライブのセットリストを自動検出し、タイムスタンプと曲名をYouTubeの内蔵チャプター機能に変換します。コンサート録画・ライブ配信・DJセットなどの動画で、任意の曲へ簡単にジャンプできるようになります。

### 機能

- **自動検出** — コメントを解析し、最適なセットリストを自動的に特定
- **マルチフォーマット対応** — 一般的なタイムスタンプ形式（`0:00`、`00:00`、`0:00:00` 等）に対応
- **チャプター注入** — 解析結果をYouTubeプレイヤーのプログレスバー上にチャプターマーカーとして表示
- **手動選択** — 自動検出が期待通りでない場合に特定のコメントを手動指定
- **設定パネル** — カスタマイズオプション（自動/手動モード、表示設定など）

### インストール

> このプロジェクトは現在開発中です。最初のリリース時にインストールリンクが追加されます。

| プラットフォーム | リンク |
|------------------|--------|
| GreasyFork（Tampermonkey / Violentmonkey） | 🚧 開発中 |
| OpenUserJS（Tampermonkey / Violentmonkey） | 🚧 開発中 |
| Firefox アドオン | 🚧 開発中 |
| Chrome 拡張機能 | 🚧 開発中 |

### 開発

```bash
# 依存関係のインストール
npm install

# ライブリロードつき開発モード
npm run dev

# 本番ビルド（全プラットフォーム）
npm run build-prod
```

### ライセンス

このプロジェクトは [MIT License](./LICENSE.txt) のもとで公開されています。
