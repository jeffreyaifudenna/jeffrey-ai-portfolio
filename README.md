# JeffreyAiFudenna Portfolio

A one-page site listing my AI projects. Plain HTML, no build step.

- `index.html` is the portfolio page (text, styles and scripts).
- `blog.html` is the blog post page.
- `media/` holds the photos, video clips and video still frames.

## Deploy
Push this folder to a GitHub repo, then import the repo in Vercel.
Framework preset: Other. No build command, no output directory.

## Themes
- `theme.css` holds every color palette (Light, Dark, plus Sunset, Terminal, Synthwave, Blueprint, Game Boy, Bubblegum, Ocean, Sepia and High contrast) and the holiday accents. Pages keep only layout and fonts.
- `theme.js` runs in `<head>` so the right palette is set before first paint, adds the picker to the nav, and remembers the choice in `localStorage`. Auto follows the OS setting.
- Holiday themes tint the accent on Auto, Light and Dark and add a few falling emoji. Visitors can switch them off in the picker. Dates live in the `HOLIDAYS` list in `theme.js`; Hanukkah and Lunar New Year are computed by the browser, and Diwali is a small table (`DIWALI`) that needs a new year added now and then.
- Preview without waiting for the date: `?holiday=halloween` or `?theme=terminal` (neither is saved).
