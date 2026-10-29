"""Builds news/feed.xml (RSS 2.0) from news/stories.json. Run after each digest is published:
    python news/build_feed.py
A story missing its title, url or date is skipped with a warning instead of stopping the build.
"""
import json, html, os, sys
from email.utils import format_datetime
from datetime import datetime, timezone

BASE = "https://jeffrey-ai-portfolio.vercel.app/"
here = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(here, "stories.json"), encoding="utf-8"))

def esc(s): return html.escape(str(s or ""), quote=True)
def warn(msg): print("warning: " + msg, file=sys.stderr)

def when(value):
    """A date (YYYY-MM-DD, shown as 12:00 UTC so it lands on the same day in every time zone)
    or a full ISO timestamp. Returns an aware datetime, or None if it can't be read."""
    s = str(value or "").strip()
    if not s: return None
    try:
        if len(s) == 10: return datetime.strptime(s, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None

items, skipped = [], 0
for day in data.get("days") or []:
    for s in day.get("stories") or []:
        title, url = (s.get("title") or "").strip(), (s.get("url") or "").strip()
        date = when(s.get("published")) or when(day.get("date"))
        missing = [k for k, v in (("title", title), ("url", url), ("date", date)) if not v]
        if missing:
            skipped += 1
            warn("skipped a story on %s (missing %s): %s" % (day.get("date"), ", ".join(missing), title or url or "untitled"))
            continue
        body = esc(s.get("summary", ""))
        if s.get("why"): body += "&lt;br/&gt;&lt;br/&gt;&lt;b&gt;Why it matters&lt;/b&gt; " + esc(s["why"])
        if s.get("source"): body += " &#8212; " + esc(s["source"])
        label = {"reported": " [Reported]", "unconfirmed": " [Unconfirmed]"}.get(s.get("status"), "")
        lines = ["    <item>",
                 f"      <title>{esc(title)}{label}</title>",
                 f"      <link>{esc(url)}</link>",
                 f"      <guid isPermaLink=\"false\">{esc(day.get('date'))}:{esc(title)}</guid>",
                 f"      <pubDate>{format_datetime(date)}</pubDate>"]
        if s.get("kind"): lines.append(f"      <category>{esc(s['kind'])}</category>")
        lines += [f"      <description>{body}</description>", "    </item>"]
        items.append("\n".join(lines))

days = data.get("days") or []
built = when(data.get("updated")) or (when(days[0].get("date")) if days else None) or datetime.now(timezone.utc)

xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Daily AI News - JeffreyAiFudenna</title>
    <link>{BASE}news.html</link>
    <atom:link href="{BASE}news/feed.xml" rel="self" type="application/rss+xml"/>
    <description>A short daily digest of AI news, researched and written each morning by an AI task. Every story links to its source.</description>
    <language>en</language>
    <lastBuildDate>{format_datetime(built)}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>
"""
open(os.path.join(here, "feed.xml"), "w", encoding="utf-8").write(xml)
print(f"feed.xml: {len(items)} items" + (f", {skipped} skipped" if skipped else ""))
