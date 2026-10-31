"""Pre-push checks for the portfolio. Standard library only.

Run from the repo root: python scripts/check.py
Exit code 1 blocks the push (see scripts/install-hooks.sh).
"""
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def fail(msg):
    errors.append(msg)


class Refs(HTMLParser):
    """Collects local href/src targets and ids from one HTML file."""

    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for key in ("href", "src"):
            v = a.get(key)
            if v and not re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//|#$)", v):
                self.refs.append(v)


def check_html():
    for page in sorted(ROOT.glob("*.html")):
        p = Refs()
        p.feed(page.read_text(encoding="utf-8"))
        for ref in p.refs:
            target = ref.split("#")[0].split("?")[0]
            if not target or target.startswith("/_vercel/"):
                continue  # same-page anchor, or a path Vercel serves itself
            if not (ROOT / target.lstrip("/")).exists():
                fail(f"{page.name}: broken local link '{ref}'")


def check_news():
    path = ROOT / "news" / "stories.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        fail(f"news/stories.json: not valid JSON ({e})")
        return
    need = ("title", "source", "published", "kind", "status", "url", "summary", "why")
    for day in data.get("days", []):
        for s in day.get("stories", []):
            label = f"news/stories.json {day.get('date')} '{str(s.get('title'))[:40]}'"
            for k in need:
                if not s.get(k):
                    fail(f"{label}: missing '{k}'")
            if not str(s.get("url", "")).startswith("https://"):
                fail(f"{label}: url must start with https://")
            if any(c in str(v) for v in s.values() for c in "<>"):
                fail(f"{label}: contains < or >")


def check_secrets():
    pattern = re.compile(
        r"(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}"
        r"|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:password|secret|api[_-]?key)\s*[:=]\s*['\"][^'\"]{8,})",
        re.I,
    )
    files = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True
    ).stdout.splitlines()
    for f in files:
        p = ROOT / f
        if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".ico", ".woff2", ".pdf"}:
            continue
        if f.startswith("jeffrey-ai-portfolio/") or not p.is_file():
            continue
        if f in (".env",) or f.startswith(".env"):
            fail(f"{f}: env file is tracked by git")
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        m = pattern.search(text)
        if m:
            fail(f"{f}: looks like a secret ('{m.group(0)[:12]}...')")


check_html()
check_news()
check_secrets()

if errors:
    print("Pre-push check FAILED:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("Pre-push check passed.")
