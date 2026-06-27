# YouTube Setlist to Chapters

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![zh-TW](https://img.shields.io/badge/lang-zh--TW-green.svg)](README.zh-TW.md)
[![ja](https://img.shields.io/badge/lang-ja-blue.svg)](README.ja.md)

---

**YouTube Setlist to Chapters** is a tool installable as a Tampermonkey / Violentmonkey userscript or a native browser extension.

It automatically detects concert setlists posted in YouTube video comments and converts their timestamps and song names into chapter markers injected onto the YouTube player progress bar. This makes it easy to jump to any specific song in concert recordings, live performances, DJ sets, and similar videos.

## Features

- **Auto-detection** — Analyzes comments to find the best matching setlist
- **Multi-format parsing** — Supports common timestamp formats (`0:00`, `00:00`, `0:00:00`, etc.)
- **Chapter injection** — Displays parsed setlist as chapter markers on the YouTube player progress bar
- **Manual selection** — Lets you manually pick a comment when auto-detection falls short
- **Settings panel** — Customizable options (auto/manual mode, display preferences, etc.)

## Installation

> This project is currently under active development. Installation links will be added with the first release.

| Platform | Link |
|----------|------|
| GreasyFork (Tampermonkey / Violentmonkey) | 🚧 In Development |
| OpenUserJS (Tampermonkey / Violentmonkey) | 🚧 In Development |
| Firefox Add-on | 🚧 In Development |
| Chrome Extension | 🚧 In Development |

## Development

```bash
# Install dependencies
npm install

# Development mode with live reload
npm run dev

# Production build (all platforms)
npm run build-prod
```

## License

This project is licensed under the [MIT License](./LICENSE.txt).
