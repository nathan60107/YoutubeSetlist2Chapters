# 0.1.5
- Read the song's name from the line below its timestamp, so setlists written across two lines get real chapter labels instead of `１`, `２`, `３` — 16 chapters across 2 of the 143 test videos are laid out this way:
  ```
  １ 10:30~14:43
  └ Mela!! / 緑黄色社会 (Ryokuoushoku Shakai)
  ```
  Only lines left holding nothing but the item's number look down — a line ending on its timestamp because the name comes first (`🎶 JOINT 00:03:09`) keeps the name it already has
- Strip a leading `└` or `├` from chapter titles, the branch these two-line setlists draw between an item and its name
- Strip leading zero-width spaces (U+200B) from chapter titles — 6 chapters opened with a pair of them, which nothing on screen would have explained

# 0.1.4
- Strip YouTube's custom emoji out of chapter titles, so a song reads `内秘心書` instead of `内秘心書:_hey:`. These render as `:_name:` shortcodes in the comment text and the separator cleanup used to bite off just the opening colon, leaving titles like `_hotsmile:` — 90 lines across 21 of the 143 test videos. Lines whose entire label was emoji no longer become chapters at all (74 of them)
- Strip a leading `～ ` from chapter titles, so `～ RE:I AM／Aimer` reads as the song's name — 54 lines across 5 of the test videos. Only stripped when a space follows, so a `～` that is part of the name itself (`道は…続かせて～`) is left alone

# 0.1.3
- Read a second, later timestamp on the same line as the item's end, so ranges like `4:55~7:52` or `0:02:06 - 0:05:08  公然の秘密` mark a segment of the song's real length instead of an assumed four minutes. Whatever separates the two is never inspected, so any style works — 69 lines across 26 of the 143 test videos are written this way
- Fix the second half of a range leaking into the chapter title, which labelled songs `~01:55:54` instead of their name
- Treat two timestamps separated by nothing but whitespace as the same point written twice (`1:05:57 1:07:12 アスノヨゾラ哨戒班`): the segment starts at the first and the second is dropped rather than shown in the label

# 0.1.2
- Find the timestamp anywhere on the line instead of requiring it at the start, so a setlist parses no matter how it is laid out. This covers songs numbered `01.`, `①`, `1  . `, full-width `１` or `└` — 19% of setlists are written this way and none of them parsed before — as well as setlists that put the timestamp after the song name

# 0.1.1
- Fix the chapter overlay never appearing: the stylesheet was injected via `innerHTML`, which YouTube's Trusted Types CSP blocks (notably in private windows), aborting startup before any chapter was parsed
- Fix chapters failing to load on videos where a commenter's avatar is missing, which made the comment fetch throw
- Scan up to three pages of comments instead of only the top 20 of the first page, so setlists ranked further down are still found

# 0.1.0
- Initial release