# Portfolio (jeffrey-ai-portfolio)

Live: https://jeffrey-ai-portfolio.vercel.app/

## Stack
Plain HTML, CSS and JS, no build step. Shared styles in `theme.css`, shared behavior in `theme.js`.
The only server code is `api/contact.js` (Vercel function, uses nodemailer).

## Deploy
Vercel deploys automatically on every push to `main`. A push is a live release.
Pushes do not prompt for approval (removed from user settings on 2026-10-31), so run the check first.

## Before pushing
1. `python scripts/check.py` (broken local links, news JSON validity, secret scan).
2. One-time per clone: `sh scripts/install-hooks.sh` makes git run that check before every push.
3. Look at the page at 390px and 1280px, light and dark.

## Daily AI news
A scheduled task ("portfolio-daily-news", ~8 AM) works in a separate clone at
`C:\Users\Jeff\Documents\daily-report\site` and pushes straight to `main`.
It may change only `news/stories.json` and `news/feed.xml` (rebuilt by `news/build_feed.py`).
Do not edit those two files by hand, and do not work in that clone.
The home page "Daily AI news" strip reads `news/stories.json` and stays hidden if the file fails to load.

## Notes
- `jeffrey-ai-portfolio/` (nested folder) is a stray separate repo; ignore it and never commit it.
- `r.out` and `.claude/` are local only.
- Contact info is decided per site; ask before adding any.
