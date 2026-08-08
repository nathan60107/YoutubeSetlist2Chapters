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
- **Respects official chapters** — videos the creator chaptered themselves are left alone, so the progress bar stays with whoever knows the video best
- **Supports every format** — timestamps in any common form (`0:00`, `00:00`, `0:00:00`), ranges such as `4:55~7:52`, songs numbered `01.`, `①` or `１`, the timestamp placed anywhere on the line, and setlists that put the song name on the line below its timestamp
- **Song names on hover** — point at a segment on the progress bar to see which song it is
- **Pick the comment yourself** — when a video has more than one setlist in the comments, each of them gets a button to move the chapters over to it, and the choice is remembered for that video

## Installation

Two steps: first install a userscript manager, then install this script. Everything is free and takes about a minute.

### Step 1: Install a userscript manager

Go to the [Tampermonkey](https://www.tampermonkey.net/) site, pick the browser you use, and press the "Add to Chrome" (or equivalent) button. Once it's installed, a new icon appears in the top-right corner of your browser.

If you already have another userscript manager, just keep using it.

### Step 2: Install this script

Open the [Greasy Fork page](https://greasyfork.org/scripts/589468-youtube-setlist-to-chapters) and press the green **Install this script** button. Your userscript manager opens a confirmation page — press **Install** there and you're done.

You can also install the `.user.js` from this repo's `dist/` directly.

### Using it

1. Open a singing stream or concert on YouTube
2. Wait a moment — the comments are read and coloured segments appear on the progress bar, one per song
3. Point at a segment to see the song's name, and click it to jump there
4. If nothing appears, no comment on that video was recognised as a setlist

## Roadmap

Planned features and improvements:

- **Settings panel** — switch the options above on and off
  - **Selection strategy** — the comment yielding the most songs always wins today; also offer preferring the creator's pinned comment, and naming whose setlists to favour or ignore
  - **Setlist threshold** — how many songs a comment needs before it counts as a setlist, fixed at 3 today
  - **Default song length** — how long a song is assumed to run when the comment gives no end time, fixed at 4 minutes today
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
