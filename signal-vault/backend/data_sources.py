"""Data source clients for Signal Vault — DataForSEO, Google Autocomplete, Gumroad, Etsy, App Store, Reddit."""

import asyncio
import base64
import json
import re
from typing import Any
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

from config import DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD

REALISTIC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

PURCHASE_INTENT_PHRASES = [
    "i wish there was", "is there an app", "i'd pay for", "i would pay",
    "looking for a tool", "frustrated with", "alternative to", "best app for",
    "anyone know of", "recommendation for", "can someone recommend",
    "looking for something", "need an app", "willing to pay", "shut up and take my money",
    "does anyone know", "is there a service", "i need a", "help me find",
]


def _dforseo_auth() -> str:
    creds = base64.b64encode(f"{DATAFORSEO_LOGIN}:{DATAFORSEO_PASSWORD}".encode()).decode()
    return f"Basic {creds}"


# ── DataForSEO ──────────────────────────────────────────────────────────────

async def dataforseo_keyword_suggestions(keywords: list[str], client: httpx.AsyncClient) -> list[dict]:
    """Get keyword suggestions with volume, CPC, competition, monthly trends."""
    if not DATAFORSEO_LOGIN:
        return []
    url = "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live"
    payload = [{"keywords": keywords[:20], "language_code": "en", "location_code": 2840, "include_seed_keyword": True, "limit": 200}]
    try:
        resp = await client.post(url, json=payload, headers={"Authorization": _dforseo_auth()}, timeout=60)
        data = resp.json()
        results = []
        for task in data.get("tasks", []):
            for item in (task.get("result", []) or []):
                for kw_item in (item.get("items", []) or []):
                    kw_data = kw_item.get("keyword_data", kw_item) or {}
                    ki = kw_data.get("keyword_info", {}) or {}
                    monthly = ki.get("monthly_searches", []) or []
                    volumes = [m.get("search_volume", 0) or 0 for m in monthly]
                    results.append({
                        "keyword": kw_data.get("keyword", kw_item.get("keyword", "")),
                        "volume": ki.get("search_volume", 0) or 0,
                        "cpc": ki.get("cpc", 0) or 0,
                        "competition": ki.get("competition", 0) or 0,
                        "trend_data": volumes,
                    })
        return results
    except Exception:
        return []


async def dataforseo_trends(keywords: list[str], client: httpx.AsyncClient) -> dict[str, list]:
    """Google Trends interest over time (max 5 keywords per request)."""
    if not DATAFORSEO_LOGIN:
        return {}
    url = "https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live"
    all_trends = {}
    for i in range(0, len(keywords), 5):
        batch = keywords[i:i+5]
        payload = [{"keywords": batch, "location_code": 2840, "time_range": "past_12_months"}]
        try:
            resp = await client.post(url, json=payload, headers={"Authorization": _dforseo_auth()}, timeout=60)
            data = resp.json()
            for task in data.get("tasks", []):
                for result in (task.get("result", []) or []):
                    for line in (result.get("items", []) or []):
                        kw = line.get("keywords", [""])[0] if line.get("keywords") else ""
                        values = [p.get("values", [0])[0] for p in (line.get("data", []) or []) if p.get("values")]
                        if kw:
                            all_trends[kw.lower()] = values
        except Exception:
            pass
        if i + 5 < len(keywords):
            await asyncio.sleep(0.5)
    return all_trends


async def dataforseo_serp(keyword: str, client: httpx.AsyncClient) -> dict:
    """Get SERP results and difficulty for a keyword."""
    if not DATAFORSEO_LOGIN:
        return {"keyword": keyword, "difficulty": 50, "results": [], "has_featured_snippet": False, "has_ai_overview": False}
    url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
    payload = [{"keyword": keyword, "location_code": 2840, "language_code": "en", "depth": 10}]
    try:
        resp = await client.post(url, json=payload, headers={"Authorization": _dforseo_auth()}, timeout=60)
        data = resp.json()
        serp_items = []
        has_snippet = False
        has_ai = False
        for task in data.get("tasks", []):
            for result in (task.get("result", []) or []):
                for item in (result.get("items", []) or []):
                    item_type = item.get("type", "")
                    if item_type == "organic":
                        serp_items.append({
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                            "title": item.get("title", ""),
                            "rank": item.get("rank_absolute", 0),
                        })
                    elif item_type == "featured_snippet":
                        has_snippet = True
                    elif item_type == "ai_overview":
                        has_ai = True
        # Estimate difficulty from domain authority signals
        difficulty = min(100, len(serp_items) * 10 + (20 if has_ai else 0))
        return {"keyword": keyword, "difficulty": difficulty, "results": serp_items[:10], "has_featured_snippet": has_snippet, "has_ai_overview": has_ai}
    except Exception:
        return {"keyword": keyword, "difficulty": 50, "results": [], "has_featured_snippet": False, "has_ai_overview": False}


# ── Google Autocomplete (FREE) ─────────────────────────────────────────────

async def google_autocomplete(keyword: str, client: httpx.AsyncClient) -> list[str]:
    """Get Google autocomplete suggestions for a keyword."""
    url = f"https://suggestqueries.google.com/complete/search?client=firefox&q={quote(keyword)}"
    try:
        resp = await client.get(url, headers={"User-Agent": REALISTIC_UA}, timeout=10)
        data = resp.json()
        return data[1] if len(data) > 1 else []
    except Exception:
        return []


# ── Gumroad Scraping ───────────────────────────────────────────────────────

async def scrape_gumroad(term: str, client: httpx.AsyncClient) -> list[dict]:
    """Scrape Gumroad discover page for products."""
    url = f"https://gumroad.com/discover?query={quote(term)}"
    try:
        resp = await client.get(url, headers={"User-Agent": REALISTIC_UA}, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        products = []
        for card in soup.select("[class*='product-card'], .discover-results-section .product-card, article"):
            title_el = card.select_one("h3, h2, [class*='title'], a[class*='product']")
            price_el = card.select_one("[class*='price'], span[class*='dollar']")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            price_text = price_el.get_text(strip=True) if price_el else "$0"
            price = _parse_price(price_text)
            review_el = card.select_one("[class*='rating'], [class*='review']")
            review_count = _parse_int(review_el.get_text(strip=True)) if review_el else 0
            link = card.select_one("a[href]")
            product_url = link["href"] if link else ""
            seller_el = card.select_one("[class*='seller'], [class*='creator'], [class*='author']")
            seller = seller_el.get_text(strip=True) if seller_el else ""
            products.append({
                "platform": "gumroad",
                "title": title[:200],
                "price": price,
                "price_model": "one-time",
                "review_count": review_count,
                "sales_count": review_count * 10,
                "rating": 0.0,
                "estimated_revenue": review_count * 10 * price,
                "seller": seller[:100],
                "url": product_url[:500],
                "product_type": _guess_product_type(title),
            })
        return products[:25]
    except Exception:
        return []


# ── Etsy Scraping ──────────────────────────────────────────────────────────

async def scrape_etsy(term: str, client: httpx.AsyncClient) -> list[dict]:
    """Scrape Etsy search results."""
    url = f"https://www.etsy.com/search?q={quote(term)}"
    try:
        resp = await client.get(url, headers={"User-Agent": REALISTIC_UA}, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        products = []
        for card in soup.select("[data-listing-id], .v2-listing-card, .wt-grid__item-xs-6"):
            title_el = card.select_one("h3, h2, [class*='title'], .v2-listing-card__title")
            price_el = card.select_one("[class*='price'], .currency-value, span.currency-value")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            price = _parse_price(price_el.get_text(strip=True) if price_el else "0")
            sales_el = card.select_one("[class*='sales'], [class*='num-favorers']")
            sales_count = _parse_int(sales_el.get_text(strip=True)) if sales_el else 0
            review_el = card.select_one("[class*='review'], [class*='rating-count']")
            review_count = _parse_int(review_el.get_text(strip=True)) if review_el else 0
            rating_el = card.select_one("[class*='stars'], input[name='rating']")
            rating = float(rating_el.get("value", 0)) if rating_el and rating_el.get("value") else 0.0
            link = card.select_one("a[href]")
            product_url = link["href"] if link else ""
            seller_el = card.select_one("[class*='shop-name'], [class*='seller']")
            seller = seller_el.get_text(strip=True) if seller_el else ""
            products.append({
                "platform": "etsy",
                "title": title[:200],
                "price": price,
                "price_model": "one-time",
                "review_count": review_count,
                "sales_count": sales_count,
                "rating": rating,
                "estimated_revenue": price * max(sales_count, 1),
                "seller": seller[:100],
                "url": product_url[:500],
                "product_type": _guess_product_type(title),
            })
        return products[:25]
    except Exception:
        return []


# ── App Store (iTunes API, FREE) ──────────────────────────────────────────

async def search_appstore(term: str, client: httpx.AsyncClient) -> list[dict]:
    """Search iTunes/App Store for apps."""
    url = f"https://itunes.apple.com/search?term={quote(term)}&entity=software&limit=25&country=us"
    try:
        resp = await client.get(url, timeout=15)
        data = resp.json()
        products = []
        for app in data.get("results", []):
            price = app.get("price", 0) or 0
            review_count = app.get("userRatingCountForCurrentVersion", 0) or 0
            products.append({
                "platform": "appstore",
                "title": app.get("trackName", "")[:200],
                "price": price,
                "price_model": "free" if price == 0 else "paid",
                "review_count": review_count,
                "sales_count": 0,
                "rating": app.get("averageUserRating", 0) or 0,
                "estimated_revenue": 0,
                "seller": app.get("artistName", "")[:100],
                "url": app.get("trackViewUrl", "")[:500],
                "product_type": "app",
            })
        return products
    except Exception:
        return []


async def fetch_appstore_reviews(app_id: int, client: httpx.AsyncClient) -> list[str]:
    """Fetch recent App Store reviews for pain point mining."""
    url = f"https://itunes.apple.com/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"
    try:
        resp = await client.get(url, timeout=15)
        data = resp.json()
        entries = data.get("feed", {}).get("entry", [])
        return [e.get("content", {}).get("label", "") for e in entries if e.get("content", {}).get("label")]
    except Exception:
        return []


# ── Reddit (.json endpoints, FREE) ────────────────────────────────────────

async def fetch_reddit_posts(subreddit: str, client: httpx.AsyncClient, sort: str = "new", limit: int = 100) -> list[dict]:
    """Fetch posts from a subreddit."""
    url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}"
    try:
        resp = await client.get(url, headers={"User-Agent": f"SignalVault/1.0 ({REALISTIC_UA})"}, timeout=15)
        data = resp.json()
        posts = []
        for child in data.get("data", {}).get("children", []):
            p = child.get("data", {})
            title = p.get("title", "")
            body = p.get("selftext", "")
            text_lower = (title + " " + body).lower()
            has_intent = any(phrase in text_lower for phrase in PURCHASE_INTENT_PHRASES)
            posts.append({
                "subreddit": subreddit,
                "title": title[:300],
                "body": body[:2000],
                "score": p.get("score", 0),
                "comment_count": p.get("num_comments", 0),
                "url": f"https://reddit.com{p.get('permalink', '')}",
                "has_purchase_intent": has_intent,
                "created_at": p.get("created_utc", 0),
            })
        return posts
    except Exception:
        return []


async def search_reddit(subreddit: str, query: str, client: httpx.AsyncClient) -> list[dict]:
    """Search within a subreddit."""
    url = f"https://www.reddit.com/r/{subreddit}/search.json?q={quote(query)}&restrict_sr=on&sort=relevance&t=year"
    try:
        resp = await client.get(url, headers={"User-Agent": f"SignalVault/1.0 ({REALISTIC_UA})"}, timeout=15)
        data = resp.json()
        posts = []
        for child in data.get("data", {}).get("children", []):
            p = child.get("data", {})
            title = p.get("title", "")
            body = p.get("selftext", "")
            text_lower = (title + " " + body).lower()
            has_intent = any(phrase in text_lower for phrase in PURCHASE_INTENT_PHRASES)
            posts.append({
                "subreddit": subreddit,
                "title": title[:300],
                "body": body[:2000],
                "score": p.get("score", 0),
                "comment_count": p.get("num_comments", 0),
                "url": f"https://reddit.com{p.get('permalink', '')}",
                "has_purchase_intent": has_intent,
                "created_at": p.get("created_utc", 0),
            })
        return posts
    except Exception:
        return []


# ── Helpers ────────────────────────────────────────────────────────────────

def _parse_price(text: str) -> float:
    match = re.search(r"[\d]+\.?\d*", text.replace(",", ""))
    return float(match.group()) if match else 0.0


def _parse_int(text: str) -> int:
    match = re.search(r"[\d,]+", text.replace(",", ""))
    return int(match.group()) if match else 0


def _guess_product_type(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["course", "class", "lesson", "workshop", "masterclass"]):
        return "course"
    if any(w in t for w in ["workbook", "worksheet", "printable", "planner"]):
        return "workbook"
    if any(w in t for w in ["template", "canva", "notion"]):
        return "template"
    if any(w in t for w in ["ebook", "e-book", "book", "guide", "pdf"]):
        return "ebook"
    if any(w in t for w in ["reading", "consultation", "session"]):
        return "service"
    if any(w in t for w in ["poster", "print", "wall art", "art"]):
        return "print"
    if any(w in t for w in ["journal", "diary"]):
        return "journal"
    if any(w in t for w in ["app", "software", "tool"]):
        return "app"
    if any(w in t for w in ["meditation", "audio", "sound"]):
        return "audio"
    if any(w in t for w in ["deck", "card", "oracle", "tarot"]):
        return "cards"
    return "other"
