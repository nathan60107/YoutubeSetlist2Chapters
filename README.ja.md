# YouTube Setlist to Chapters

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![zh-TW](https://img.shields.io/badge/lang-zh--TW-green.svg)](README.zh-TW.md)
[![ja](https://img.shields.io/badge/lang-ja-blue.svg)](README.ja.md)

---

**YouTube Setlist to Chapters** は、Tampermonkey / Violentmonkey のユーザースクリプト、またはブラウザネイティブ拡張機能としてインストールできるツールです。

YouTubeの動画コメントに投稿されたライブのセットリストを自動検出し、タイムスタンプと曲名をYouTubeプレイヤーのプログレスバー上にチャプターマーカーとして表示します。コンサート録画・ライブ配信・DJセットなどの動画で、任意の曲へ簡単にジャンプできるようになります。

## 機能

- **自動検出** — コメントを解析し、最適なセットリストを自動的に特定
- **マルチフォーマット対応** — 一般的なタイムスタンプ形式（`0:00`、`00:00`、`0:00:00` 等）に対応
- **チャプター注入** — 解析結果をYouTubeプレイヤーのプログレスバー上にチャプターマーカーとして表示
- **手動選択** — 自動検出が期待通りでない場合に特定のコメントを手動指定
- **設定パネル** — カスタマイズオプション（自動/手動モード、表示設定など）

## インストール

> このプロジェクトは現在開発中です。最初のリリース時にインストールリンクが追加されます。

| プラットフォーム | リンク |
|------------------|--------|
| GreasyFork（Tampermonkey / Violentmonkey） | 🚧 開発中 |
| OpenUserJS（Tampermonkey / Violentmonkey） | 🚧 開発中 |
| Firefox アドオン | 🚧 開発中 |
| Chrome 拡張機能 | 🚧 開発中 |

## 開発

```bash
# 依存関係のインストール
npm install

# ライブリロードつき開発モード
npm run dev

# 本番ビルド（全プラットフォーム）
npm run build-prod
```

## ライセンス

このプロジェクトは [MIT License](./LICENSE.txt) のもとで公開されています。
