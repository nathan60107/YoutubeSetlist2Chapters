/* 由 npm run test-page 從 src/chapterParser.ts 產生，勿手動編輯。供 test/candidates.html 使用。 */
var CHAPTER_PARSER = (function (exports) {
    'use strict';

    /**
     * Matches a timestamp anywhere in the line: 0:00, 1:23, 1:23:45.
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
     * Basic strategy: the first timestamp on the line is where the item starts, wherever it sits,
     * and the title is whatever text the line has left — the two are not required to be in any
     * particular order.
     *
     * A second, later timestamp on the same line is the item's end, provided *something* is written
     * between the two. The separator itself is never inspected: `4:55~7:52`, `0:00 - 3:45` and
     * `10:30 → 14:43` are all the same thing, and enumerating what people write there would only be
     * another list to keep chasing. Separated by nothing but whitespace it is not a range but the
     * same point written twice (`1:05:57 1:07:12 アスノヨゾラ哨戒班`), and the second is dropped.
     * A second timestamp that is *not* later than the first is neither — those are corrections or
     * side notes (`53:07 サマータイムシンデレラ 52:43`) — so it stays part of the title.
     *
     * The text after the last consumed timestamp is preferred, and only when there is none does the
     * text before the first one become the title. That ordering is what keeps a numbering prefix out
     * of the title: on `01. 0:00 Intro` both sides hold text, and the song name is the one on the right.
     *
     * Example: "0:00 - Intro"      → { timestampSec: 0, title: "Intro" }
     *          "01. 0:00 Intro"    → { timestampSec: 0, title: "Intro" }
     *          "🎶 Intro 0:00"     → { timestampSec: 0, title: "🎶 Intro" }
     *          "4:55~7:52 Intro"   → { timestampSec: 295, endTimestampSec: 472, title: "Intro" }
     *          "10:00 10:10 Intro" → { timestampSec: 600, title: "Intro" }
     */
    const basicLineParseStrategy = {
        name: "basic",
        parseLine(line) {
            const trimmed = line.trim();
            const start = TIMESTAMP_RE.exec(trimmed);
            if (!start)
                return null;
            const startSec = parseTimestampSec(start[0]);
            // Searched in the remainder rather than with a /g regex, so the module-level pattern stays
            // stateless and `index` stays a plain number under the ES6 lib this project targets
            const afterStart = start.index + start[0].length;
            const rest = trimmed.slice(afterStart);
            const second = TIMESTAMP_RE.exec(rest);
            const secondSec = second ? parseTimestampSec(second[0]) : undefined;
            // An earlier-or-equal second timestamp belongs to neither the item nor the parser: those are
            // corrections and side notes (`53:07 サマータイムシンデレラ 52:43`), left in the title as written
            const trailing = second && secondSec > startSec ? second : null;
            // What sits between the two decides what the later one means. Any visible character makes it
            // an end time, and the separator itself is never inspected — `4:55~7:52`, `0:00 - 3:45` and
            // `10:30 → 14:43` are the same thing, so enumerating those would be another list to chase.
            // Nothing but whitespace means one point written twice, and the second is simply dropped:
            // `10:00 10:10 AAAA` is one segment starting at 10:00, titled `AAAA`.
            const endTimestampSec = trailing && /\S/.test(rest.slice(0, trailing.index))
                ? secondSec
                : undefined;
            // Either way the trailing timestamp is skipped over — it never belongs in the title
            const consumedUntil = trailing ? afterStart + trailing.index + trailing[0].length : afterStart;
            // No .trim() needed on either: the line is already trimmed, so the only end that can carry
            // whitespace is the one facing the cut — which is exactly what each regex takes off
            const after = trimmed.slice(consumedUntil).replace(LEADING_SEPARATOR_RE, "");
            const before = trimmed.slice(0, start.index).replace(TRAILING_SEPARATOR_RE, "");
            const title = after || before;
            if (!title)
                return null;
            return endTimestampSec !== undefined
                ? { timestampSec: startSec, endTimestampSec, title }
                : { timestampSec: startSec, title };
        },
    };
    const activeChapterParseStrategy = basicLineParseStrategy;

    exports.activeChapterParseStrategy = activeChapterParseStrategy;

    return exports;

})({});
