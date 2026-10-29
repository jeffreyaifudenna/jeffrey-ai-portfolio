"""Builds news/feed.xml (RSS 2.0) from news/stories.json. Run after each digest is published:
    python news/build_feed.py
"""
import json, html, os
from email.utils import format_datetime
from datetime import datetime, timezone

BASE = "https://jeffrey-ai-portfolio.vercel.app/"
here = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(here, "stories.json"), encoding="utf-8"))

def esc(s): return html.escape(str(s or ""), quote=True)
def rfc(date): return format_datetime(datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc))

items = []
for day in data.get("days", []):
    for s in day.get("stories", []):
        body = esc(s.get("summary", ""))
        if s.get("why"): body += "&lt;br/&gt;&lt;br/&gt;&lt;b&gt;Why it matters&lt;/b&gt; " + esc(s["why"])
        if s.get("source"): body += " &#8212; " + esc(s["source"])
        label = {"reported": " [Reported]", "unconfirmed": " [Unconfirmed]"}.get(s.get("status"), "")
        items.append(f"""    <item>
      <title>{esc(s["title"])}{label}</title>
      <link>{esc(s.get("url"))}</link>
      <guid isPermaLink="false">{esc(day["date"])}:{esc(s["title"])}</guid>
      <pubDate>{rfc(s.get("published") or day["date"])}</pubDate>
      <category>{esc(s.get("kind"))}</category>
      <description>{body}</description>
    </item>""")

xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Daily AI News - JeffreyAiFudenna</title>
    <link>{BASE}news.html</link>
    <atom:link href="{BASE}news/feed.xml" rel="self" type="application/rss+xml"/>
    <description>A short daily digest of AI news, researched and written each morning by an AI task. Every story links to its source.</description>
    <language>en</language>
    <lastBuildDate>{rfc(data.get("updated") or data["days"][0]["date"])}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>
"""
open(os.path.join(here, "feed.xml"), "w", encoding="utf-8").write(xml)
print(f"feed.xml: {len(items)} items")
