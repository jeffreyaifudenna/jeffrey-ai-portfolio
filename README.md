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

## Contact form
- `contact.html` posts JSON to `api/contact.js`, a Vercel serverless function that sends the message from your Gmail account over SMTP (nodemailer, the site's only dependency, listed in `package.json`). It has a hidden honeypot field and server-side validation.
- Set these in the Vercel project (Settings, Environment Variables): `GMAIL_USER` (the Gmail address) and `GMAIL_APP_PASSWORD` (create one at myaccount.google.com/apppasswords; it needs 2-step verification on). Optionally `CONTACT_TO` to deliver to a different inbox. Messages arrive with the visitor as reply-to.
- After the message to you goes out, the function sends the visitor a one-time email linking `guide.html`, a free how-to-use-AI article. The page is `noindex` and left out of the sitemap and nav, so it is reachable only through that email. Edit the wording in `api/contact.js` and the article in `guide.html`.
- The function only runs on Vercel (or `vercel dev`); `python -m http.server` serves the page but the send will fail.

## SEO
- Each public page's `<head>` has a title (under 60 characters), a description (under 155), Open Graph and Twitter tags, and a JSON-LD block (Person, WebSite, BreadcrumbList and a page type). The Person `@id` (`/#jeffrey`) is shared across pages; keep it the same.
- Link previews use `media/buddha.jpg` (absolute URL). Change every page if the domain changes, plus `sitemap.xml`, `robots.txt` and `llms.txt`.
- Bump `<lastmod>` in `sitemap.xml` when a page's content changes. `guide.html` stays `noindex` and out of the sitemap.

## Deploy
Push this folder to a GitHub repo, then import the repo in Vercel.
Framework preset: Other. No build command, no output directory.
