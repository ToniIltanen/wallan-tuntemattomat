#!/usr/bin/env python3
"""
Fetch upcoming gigs from Buukkaa and write data/events.json
Designed to run in CI (GitHub Actions) where network access is allowed.
"""
import urllib.request
import re
import json
import os
import html

BUUKKAA_URL = "https://buukkaa-bandi.fi/fi/band/wallan-tuntemattomat"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "events.json")

def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "github-actions/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")

def find_upcoming_list(html_text):
    # find the 'Tulevat' heading, then the next <ul> block
    idx = html_text.find("Tulevat")
    if idx == -1:
        return None

    ul_start = html_text.find("<ul", idx)
    if ul_start == -1:
        return None

    ul_end = html_text.find("</ul>", ul_start)
    if ul_end == -1:
        return None

    return html_text[ul_start:ul_end+6]

def extract_list_items(ul_block):
    items = re.findall(r"<li[^>]*>(.*?)</li>", ul_block, flags=re.S|re.I)
    results = []
    for li in items:
        text = re.sub(r"<[^>]+>", "", li)  # strip tags
        text = html.unescape(text)
        text = " ".join(text.split())
        if not text:
            continue
        parts = [p.strip() for p in text.split(",") if p.strip()]
        if not parts:
            continue
        date_text = parts[0]
        rest = parts[1:]
        city = rest[0] if len(rest) >= 1 else ""
        venue = ", ".join(rest[1:]) if len(rest) >= 2 else (rest[0] if len(rest) == 1 else "")

        # parse finnish date dd.mm.yyyy
        m = re.match(r"^(\d{1,2})\.(\d{1,2})\.(\d{4})$", date_text)
        iso = None
        if m:
            day, month, year = m.groups()
            iso = f"{year}-{int(month):02d}-{int(day):02d}"

        results.append({
            "date": iso or date_text,
            "displayDate": date_text,
            "city": city,
            "venue": venue if venue else ("Yksityistilaisuus" if "yksityistilaisuus" in text.lower() else "")
        })

    return results

def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)

def main():
    try:
        html_text = fetch_html(BUUKKAA_URL)
    except Exception as e:
        print("Failed to fetch source:", e)
        return 1

    ul = find_upcoming_list(html_text)
    if not ul:
        print("Could not locate upcoming list in HTML")
        return 1

    events = extract_list_items(ul)
    if not events:
        print("No events parsed")
        return 1

    # Write to repo-relative data/events.json (scripts/../data/events.json)
    out = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data", "events.json"))
    write_json(out, events)
    print(f"Wrote {len(events)} events to {out}")
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
