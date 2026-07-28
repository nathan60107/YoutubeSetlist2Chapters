# 0.1.2
- Find the timestamp anywhere on the line instead of requiring it at the start, so a setlist parses no matter how it is laid out. This covers songs numbered `01.`, `①`, `1  . `, full-width `１` or `└` — 19% of setlists are written this way and none of them parsed before — as well as setlists that put the timestamp after the song name

# 0.1.1
- Fix the chapter overlay never appearing: the stylesheet was injected via `innerHTML`, which YouTube's Trusted Types CSP blocks (notably in private windows), aborting startup before any chapter was parsed
- Fix chapters failing to load on videos where a commenter's avatar is missing, which made the comment fetch throw
- Scan up to three pages of comments instead of only the top 20 of the first page, so setlists ranked further down are still found

# 0.1.0
- Initial release