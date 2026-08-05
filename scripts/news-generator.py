#!/usr/bin/env python3
"""
Tariff Buddy — Daily News Story Generator

Pulls real tariff news from Google News RSS, summarizes each into the
Tariff Buddy story format (what happened → what costs more → what to do),
and saves to the tb_stories table in Supabase.

Runs daily via Hermes cron.
"""

import urllib.request, urllib.parse, xml.etree.ElementTree as ET
import json, subprocess, sys, os, time
from datetime import datetime, timedelta

# Load credentials from .env file
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
SUPABASE_SECRET = os.environ.get("SUPABASE_SECRET", "")
SBP_TOKEN = os.environ.get("SBP_TOKEN", "")
PROJECT_REF = os.environ.get("PROJECT_REF", "")

RSS_URL = "https://news.google.com/rss/search?q=tariff+import+trade&hl=en-US&gl=US&ceid=US:en"

def fetch_news():
    """Fetch tariff news from Google News RSS via CORS proxy"""
    try:
        req = urllib.request.Request(RSS_URL, headers={"User-Agent": "TariffBuddy/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_text = resp.read().decode("utf-8")
    except Exception as e:
        print(f"Failed to fetch RSS: {e}")
        return []

    root = ET.fromstring(xml_text)
    items = []
    for item in root.findall(".//item")[:8]:  # Top 8 stories
        title = item.findtext("title", default="").strip()
        link = item.findtext("link", default="").strip()
        pub_date = item.findtext("pubDate", default="").strip()
        source = item.findtext("source", default="").strip()

        # Split "Headline - Source" format
        if " - " in title and not source:
            parts = title.rsplit(" - ", 1)
            title, source = parts[0].strip(), parts[1].strip()

        if title and link:
            items.append({"title": title, "link": link, "pub_date": pub_date, "source": source or "News"})
    return items

def summarize_with_ai(news_items):
    """Use Claude to summarize news items into Tariff Buddy story format"""
    if not news_items:
        print("No news items to summarize")
        return []

    news_text = "\n\n".join([
        f"Story {i+1}:\nHeadline: {item['title']}\nSource: {item['source']}"
        for i, item in enumerate(news_items)
    ])

    prompt = f"""You are Tariff Buddy's news analyst. Analyze these tariff/trade news headlines and create consumer-friendly stories.

NEWS HEADLINES:
{news_text}

For each NEWsworthy story, output a JSON array of story objects. Each story MUST have:
- "headline": Clear, simple headline a consumer understands (not the raw news headline)
- "tag": Category tag (e.g. "Electronics", "Food & beverages", "Clothing", "Building & Home", "Tools & Hardware", "Furniture", "Trade")
- "severity": "high", "medium", or "low" based on consumer price impact
- "what": 1-2 sentences explaining what happened in plain English (no jargon)
- "affected": Comma-separated list of specific products affected
- "action": 1-2 sentences of practical advice for a consumer
- "category": One of: food, home, electronics, clothing, mobility, building, health, furniture, recreation, materials, baby, garden
- "origin": Country code of origin most affected: CN, US, MX, CA, EU, JP, KR, VN, etc. Use "MULTI" if multiple

Rules:
- Only include stories that actually affect consumer prices
- Skip pure political stories with no consumer impact
- Be honest — if it's uncertain, say so
- Write in plain English, not trade-policy jargon
- Maximum 4 stories

Output ONLY valid JSON array, no markdown fences, no explanation. If no stories are worth including, output []."""

    try:
        result = subprocess.run(
            ["claude", "-p"],
            input=prompt,
            capture_output=True, text=True, timeout=90
        )
        output = result.stdout.strip()
        # Clean markdown fences
        if "```" in output:
            # Extract content between fences
            fence_start = output.find("```")
            fence_end = output.rfind("```")
            if fence_start != fence_end:
                inner = output[fence_start:fence_end+3]
                # Remove the fence markers
                inner = inner.split("\n", 1)[-1] if "\n" in inner else inner
                output = inner.rsplit("```", 1)[0].strip()
        # If it's a single object not in array, wrap it
        if output.startswith("{") and not output.startswith("["):
            output = "[" + output + "]"
        stories = json.loads(output)
        if isinstance(stories, list):
            return stories
    except Exception as e:
        print(f"AI summarization failed: {e}")
        # Try gemini as fallback
        try:
            result = subprocess.run(
                ["gemini", "-p", prompt],
                input=prompt,
                capture_output=True, text=True, timeout=90
            )
            output = result.stdout.strip()
            if "```" in output:
                fence_start = output.find("```")
                fence_end = output.rfind("```")
                if fence_start != fence_end:
                    inner = output[fence_start:fence_end+3]
                    inner = inner.split("\n", 1)[-1] if "\n" in inner else inner
                    output = inner.rsplit("```", 1)[0].strip()
            if output.startswith("{") and not output.startswith("["):
                output = "[" + output + "]"
            stories = json.loads(output)
            if isinstance(stories, list):
                return stories
        except Exception as e2:
            print(f"Gemini fallback also failed: {e2}")
    return []

def save_stories(stories, news_items):
    """Save stories to Supabase tb_stories table via REST API"""
    if not stories:
        print("No stories to save")
        return 0

    today = datetime.now().strftime("%Y-%m-%d")
    saved = 0
    sources = list(set(item["source"] for item in news_items[:3]))

    for i, story in enumerate(stories):
        story_id = f"auto-{today}-{i+1}"

        body = json.dumps({
            "id": story_id,
            "headline": story.get("headline", ""),
            "date": today,
            "severity": story.get("severity", "medium"),
            "tag": story.get("tag", "Trade"),
            "what": story.get("what", ""),
            "affected": story.get("affected", ""),
            "action": story.get("action", ""),
            "category": story.get("category", "materials"),
            "origin": story.get("origin", "MULTI"),
            "sources": sources,
            "is_published": True,
        }).encode()

        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/tb_stories",
            data=body,
            headers={
                "apikey": SUPABASE_SECRET,
                "Authorization": f"Bearer {SUPABASE_SECRET}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp.read()
            saved += 1
            print(f"  Saved: {story.get('headline', '?')[:60]}")
        except Exception as e:
            print(f"  Failed to save story {i+1}: {e}")

    return saved

def cleanup_old_auto_stories():
    """Delete auto-generated stories older than 14 days to keep the feed fresh"""
    cutoff_date = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/tb_stories?id=like.auto-*&date=lt.{cutoff_date}",
        headers={
            "apikey": SUPABASE_SECRET,
            "Authorization": f"Bearer {SUPABASE_SECRET}",
        },
        method="DELETE"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        print("Old auto-stories cleaned up")
    except Exception as e:
        print(f"Cleanup failed: {e}")

def main():
    print(f"=== Tariff Buddy News Generator — {datetime.now().strftime('%Y-%m-%d %H:%M')} ===")

    # Step 1: Fetch news
    print("\n1. Fetching tariff news...")
    news = fetch_news()
    print(f"   Found {len(news)} headlines")
    for item in news[:5]:
        print(f"   - {item['title'][:70]}")

    if not news:
        print("No news found. Exiting.")
        return

    # Step 2: Summarize with AI
    print("\n2. Generating consumer stories with AI...")
    stories = summarize_with_ai(news)
    print(f"   Generated {len(stories)} stories")

    if not stories:
        print("No stories generated. Exiting.")
        return

    for s in stories:
        print(f"   - [{s.get('severity','?')}] {s.get('headline', '?')[:60]}")

    # Step 3: Clean up old stories
    print("\n3. Cleaning up old auto-stories...")
    cleanup_old_auto_stories()

    # Step 4: Save to database
    print("\n4. Saving to Supabase...")
    saved = save_stories(stories, news)
    print(f"\n=== Done: {saved} stories saved ===")

if __name__ == "__main__":
    main()
