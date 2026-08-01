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
    /**
     * YouTube custom emoji, written `:_name:` in comment text.
     *
     * Anchored on `:_` rather than `:...:`, which would also match across a title holding two ordinary
     * colons and eat the text between them: `コッコロ(CV:M・A・O)、キャル(CV:` is a real dataset line.
     */
    const EMOJI_SHORTCODE_RE = /:_[^\s:]*:/g;
    /**
     * The box left where a custom emoji used to be — `:_penlight:□:_penlight:` shows one sitting among
     * the shortcodes that survived. Nothing the commenter typed, so it is stripped like a shortcode and
     * `2:06:01 □□□□` drops out instead of putting four boxes on the progress bar.
     */
    const TOFU_RE = /□/g;
    /**
     * Strips separator characters left on either side of the removed timestamp. `\s` covers the
     * full-width space these comments align columns with, but not the zero-width space U+200B.
     *
     * Leading-only, and only before whitespace: `～` opens 54 title lines (`～ RE:I AM／Aimer`) but is
     * also part of song names when it trails (`道は…続かせて～`).
     *
     * `└` and `├` draw the branch that ties a title line to the timestamp line above it
     * (`└ ロキ / Loki (みきとP)`), and unlike `～` they need no whitespace guard.
     */
    const LEADING_SEPARATOR_RE = /^(?:[\s\u200B\-–—|•·:└├]|～(?=\s))+/;
    const TRAILING_SEPARATOR_RE = /[\s\u200B\-–—|•·:]+$/;
    /**
     * Cleans one side of the line: what the emoji left behind first, separators second. Reversed, the
     * separator pass eats the shortcode's opening `:` and strands the rest as `_hotsmile:`.
     *
     * Both ends are stripped, not just the one facing the timestamp — removing a shortcode can expose
     * whitespace at the far end too (`0:00 曲名 :_hotsmile:` leaves `曲名 `).
     */
    function cleanTitlePart(part) {
        return part
            .replace(EMOJI_SHORTCODE_RE, "")
            .replace(TOFU_RE, "")
            .replace(LEADING_SEPARATOR_RE, "")
            .replace(TRAILING_SEPARATOR_RE, "");
    }
    /**
     * Text that names nothing: the item's number and nothing else, in the widths and enclosed forms
     * these comments use (`1`, `01.`, `１`, `①`).
     *
     * The enclosed numbers take two ranges because Unicode split them across two blocks. `①-⓿`
     * (U+2460–U+24FF) is every enclosed form of 1 through 20 — `①`, `⑴`, `⒈`, `⓪` — and is left
     * whole rather than narrowed to `①-⑳`, since a commenter reaching for any of them means the
     * same thing. 21 through 50 were added later, in `㉑-㊿` (U+3251–U+32BF), and setlists do run
     * past twenty songs.
     *
     * The one place the parser looks at numbering at all, and only to answer "does this line hold a
     * title of its own?" — never to strip a prefix, which {@link TIMESTAMP_RE} is unanchored to avoid.
     */
    const NUMBERING_ONLY_RE = /^(?:[\d０-９]+|[①-⓿㉑-㊿])[.．、]?$/;
    /**
     * The title for a timestamp line that carries none itself, taken from the line below it
     * (`１ 10:30~14:43` / `└ Mela!! / 緑黄色社会 (Ryokuoushoku Shakai) 🤍`).
     *
     * Gated on the line having nothing left but its number, not on "no text after the timestamp":
     * `🎶 JOINT 00:03:09` also ends on its timestamp, and the line under it is the decorative
     * `+☆+｡･ﾟ･` that separates the songs — 6 good titles would become 6 copies of that garland.
     *
     * The next line must carry no timestamp of its own, so a single-line setlist never eats its
     * successor. Only that one line is read: a second would be the romanization
     * (`├ "超" インフルエンサー→☆` / `└ (Chou Influencer)`), and the name alone reads better.
     *
     * Returns "" when the line is not that shape.
     */
    function titleFromNextLine(before, next) {
        if (before && !NUMBERING_ONLY_RE.test(before))
            return "";
        if (next === undefined)
            return "";
        const trimmed = next.trim();
        if (TIMESTAMP_RE.test(trimmed))
            return "";
        return cleanTitlePart(trimmed);
    }
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
     * When the line holds no title at all — only the item's number — {@link titleFromNextLine} looks
     * one line down for it.
     *
     * Whichever side wins is then cleaned by {@link cleanTitlePart}.
     *
     * Example: "0:00 - Intro"      → { timestampSec: 0, title: "Intro" }
     *          "01. 0:00 Intro"    → { timestampSec: 0, title: "Intro" }
     *          "🎶 Intro 0:00"     → { timestampSec: 0, title: "🎶 Intro" }
     *          "0:00 Intro:_hey:"  → { timestampSec: 0, title: "Intro" }
     *          "0:00 :_hey:"       → null
     *          "4:55~7:52 Intro"   → { timestampSec: 295, endTimestampSec: 472, title: "Intro" }
     *          "10:00 10:10 Intro" → { timestampSec: 600, title: "Intro" }
     *          "1 0:00" + "└ Intro" → { timestampSec: 0, title: "Intro" }
     */
    const basicLineParseStrategy = {
        name: "basic",
        parseLines(lines) {
            return lines.map((line, i) => parseLine(line, lines[i + 1]));
        },
    };
    function parseLine(line, next) {
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
        const after = cleanTitlePart(trimmed.slice(consumedUntil));
        const before = cleanTitlePart(trimmed.slice(0, start.index));
        // The line below is asked only when this one names nothing; `before` is still the fallback, so
        // a numbered line whose neighbour is unusable keeps its old title rather than losing the chapter
        //
        // A line whose only text was an emoji, or the box left where one used to be (`24:16
        // :_hotsmile:`, `1:58:41 □`), is left with nothing on any of the three, and drops out here
        // rather than becoming a chapter with an empty or mangled title
        const title = after || titleFromNextLine(before, next) || before;
        if (!title)
            return null;
        return endTimestampSec !== undefined
            ? { timestampSec: startSec, endTimestampSec, title }
            : { timestampSec: startSec, title };
    }
    const activeChapterParseStrategy = basicLineParseStrategy;

    exports.activeChapterParseStrategy = activeChapterParseStrategy;

    return exports;

})({});
