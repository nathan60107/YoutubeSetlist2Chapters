# YouTube Setlist to Chapters

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![zh-TW](https://img.shields.io/badge/lang-zh--TW-green.svg)](README.zh-TW.md)
[![ja](https://img.shields.io/badge/lang-ja-blue.svg)](README.ja.md)

---

**YouTube Setlist to Chapters** turns the setlist someone posted in the comments into chapter markers on the YouTube progress bar.

Singing streams and concerts almost never come with chapters, but there is nearly always a comment listing every song and the time it starts. This script finds that comment and draws it onto the progress bar, so you can see where each song sits and jump straight to the one you want.

## Features

- **Nothing to set up** — open a video and the chapters appear on their own; no account, no API key, no payment
- **Finds the setlist in the comments** — the comment section is scanned and the one that best looks like a setlist is used, so videos the uploader never added chapters to work too
- **Supports every format** — timestamps in any common form (`0:00`, `00:00`, `0:00:00`), ranges such as `4:55~7:52`, songs numbered `01.`, `①` or `１`, the timestamp placed anywhere on the line, and setlists that put the song name on the line below its timestamp
- **Song names on hover** — point at a segment on the progress bar to see which song it is

## Installation

Two steps: first install a userscript manager, then install this script. Everything is free and takes about a minute.

### Step 1: Install a userscript manager

Go to the [Tampermonkey](https://www.tampermonkey.net/) site, pick the browser you use, and press the "Add to Chrome" (or equivalent) button. Once it's installed, a new icon appears in the top-right corner of your browser.

If you already have another userscript manager, just keep using it.

### Step 2: Install this script

Not published on Greasy Fork yet — the install link will be added here with the first release.

You can also install the `.user.js` from this repo's `dist/` directly.

### Using it

1. Open a singing stream or concert on YouTube
2. Wait a moment — the comments are read and coloured segments appear on the progress bar, one per song
3. Point at a segment to see the song's name, and click it to jump there
4. If nothing appears, no comment on that video was recognised as a setlist

## Roadmap

Planned features and improvements:

- **Respect official chapters** — do nothing when the video already has official (creator-provided) chapters
- **Description parsing** — detect setlists from the video description, not just comments
- **Manual selection** — pick the comment yourself when the automatic choice is wrong
- **Settings panel** — switch the options above on and off
- **Result caching** — remember the chosen setlist per video to avoid re-parsing
- **Multi-language interface** — localized user interface
- **Browser extension** — a packaged browser extension in addition to the userscript

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
