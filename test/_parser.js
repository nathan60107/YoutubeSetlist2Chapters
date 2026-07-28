/* 由 npm run test-page 從 src/chapterParser.ts 產生，勿手動編輯。供 test/candidates.html 使用。 */
var CHAPTER_PARSER = (function (exports) {
    'use strict';

    /**
     * Matches the first timestamp anywhere in the line: 0:00, 1:23, 1:23:45.
     *
     * Deliberately unanchored. 19% of setlists number their songs, and the numbering is written
     * every way imaginable — `01.`, `08. `, `1  . `, `①`, full-width `１`. Enumerating those
     * prefixes is a losing game and a stripper for them risks eating the hour out of a plain
     * `10:00 シャルル`. Taking the first timestamp wherever it sits makes every prefix a non-issue.
     */
    const TIMESTAMP_RE = /\d{1,2}:\d{2}(?::\d{2})?/;
    /** Strips common separator characters left behind on either side of the removed timestamp */
    const LEADING_SEPARATOR_RE = /^[\s\-–—|•·:]+/;
    const TRAILING_SEPARATOR_RE = /[\s\-–—|•·:]+$/;
    function parseTimestampSec(ts) {
        const parts = ts.split(":").map(Number);
        return parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + parts[1];
    }
    /**
     * Basic strategy: the first timestamp on the line wins, wherever it sits, and the title is
     * whatever text the line has left — the two are not required to be in any particular order.
     *
     * The text after the timestamp is preferred, and only when there is none does the text before
     * it become the title. That ordering is what keeps a numbering prefix out of the title: on
     * `01. 0:00 Intro` both sides hold text, and the song name is the one on the right.
     *
     * Example: "0:00 - Intro"    → { timestampSec: 0, title: "Intro" }
     *          "01. 0:00 Intro"  → { timestampSec: 0, title: "Intro" }
     *          "🎶 Intro 0:00"   → { timestampSec: 0, title: "🎶 Intro" }
     */
    const basicLineParseStrategy = {
        name: "basic",
        parseLine(line) {
            const trimmed = line.trim();
            const match = TIMESTAMP_RE.exec(trimmed);
            if (!match)
                return null;
            // No .trim() needed on either: the line is already trimmed, so the only end that can carry
            // whitespace is the one facing the cut — which is exactly what each regex takes off
            const after = trimmed.slice(match.index + match[0].length).replace(LEADING_SEPARATOR_RE, "");
            const before = trimmed.slice(0, match.index).replace(TRAILING_SEPARATOR_RE, "");
            const title = after || before;
            if (!title)
                return null;
            return { timestampSec: parseTimestampSec(match[0]), title };
        },
    };
    const activeChapterParseStrategy = basicLineParseStrategy;

    exports.activeChapterParseStrategy = activeChapterParseStrategy;

    return exports;

})({});
