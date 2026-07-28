# 0.1.1
- Fix the chapter overlay never appearing: the stylesheet was injected via `innerHTML`, which YouTube's Trusted Types CSP blocks (notably in private windows), aborting startup before any chapter was parsed
- Fix chapters failing to load on videos where a commenter's avatar is missing, which made the comment fetch throw
- Scan up to three pages of comments instead of only the top 20 of the first page, so setlists ranked further down are still found

# 0.1.0
- Initial release