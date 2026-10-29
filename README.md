# JeffreyAiFudenna Portfolio

My AI projects, written up. Plain HTML, no build step.

- `index.html` is the portfolio page. `builds.html` is the tools, prompts and process page. `news.html` is the Daily AI News digest. `story.html` is the 11:11 short story.
- `theme.css` and `theme.js` hold every color theme, the holiday accents and the theme picker, shared by all pages.
- `news/stories.json` is written by the scheduled news task; `news/build_feed.py` builds `news/feed.xml` from it.
- `llms.txt` is a plain-text map of the site for AI agents. `media/` holds photos, clips and stills.

## Deploy
Push this folder to a GitHub repo, then import the repo in Vercel.
Framework preset: Other. No build command, no output directory.
