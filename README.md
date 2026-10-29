# JeffreyAiFudenna Portfolio

My AI projects, written up. Plain HTML, no build step.

- `index.html` is the portfolio page. `builds.html` is the tools, prompts and process page. `news.html` is the Daily AI News digest. `story.html` is the 11:11 short story.
- `theme.css` and `theme.js` hold every color theme, the holiday accents and the theme picker, shared by all pages.
- `news/stories.json` is written by the scheduled news task; `news/build_feed.py` builds `news/feed.xml` from it.
- `llms.txt` is a plain-text map of the site for AI agents. `media/` holds photos, clips and stills.

## Themes
- The round button in the nav toggles light and dark. The "themes" link in each footer opens the full picker: Auto, the fun themes (Sunset, Terminal, Synthwave, Blueprint, Game Boy, Bubblegum, Ocean, Sepia), High contrast and the holiday switch. The choice is kept in `localStorage`.
- Holiday themes tint the accent and drop a few emoji, on the actual day only, and only over Auto, Light and Dark. Edit the `HOLIDAYS` list in `theme.js`; Diwali (`DIWALI`) and Lunar New Year (`LUNAR`) are year tables that need a new year added now and then.
- The tab icon is redrawn in the current theme's colors. The small gamepad icon in each footer opens an on-screen NES-style controller; entering the Konami code on it (↑ ↑ ↓ ↓ ← → ← → B A, by tapping or with the keyboard) unlocks a hidden Quest theme, which then appears in the picker.
- Preview without waiting for the date: `?holiday=halloween` or `?theme=terminal` (neither is saved).

## Deploy
Push this folder to a GitHub repo, then import the repo in Vercel.
Framework preset: Other. No build command, no output directory.
