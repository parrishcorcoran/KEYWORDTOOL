"""Rule-based intelligence for Signal Vault — no LLM dependency.

Intent classification via keyword matching, pain extraction via frequency
counting, product landscape via aggregation. All deterministic, instant, free.
"""

import json
import re
from collections import Counter


# ── Intent Classification ──────────────────────────────────────────────────

TRANSACTIONAL_SIGNALS = [
    "buy", "purchase", "order", "download", "get", "shop", "deal", "coupon",
    "discount", "free trial", "subscribe", "pricing", "cost", "cheap",
    "affordable", "hire", "book a", "schedule",
]

COMMERCIAL_SIGNALS = [
    "best", "top", "review", "vs", "versus", "alternative", "comparison",
    "compare", "recommended", "most popular", "rated", "which", "should i",
    "worth it", "pros and cons",
]

NAVIGATIONAL_SIGNALS = [
    "login", "sign in", "sign up", "dashboard", "account", "app", "website",
    "official", ".com", ".io", ".app",
]

INFORMATIONAL_SIGNALS = [
    "what is", "what are", "how to", "how do", "why", "when", "guide",
    "tutorial", "learn", "meaning", "definition", "explain", "example",
    "difference between", "types of", "history of", "benefits of",
]


def classify_intents(keywords: list[str]) -> dict[str, str]:
    """Classify search intent for keywords using keyword matching."""
    result = {}
    for kw in keywords:
        result[kw] = _classify_single(kw.lower())
    return result


def _classify_single(kw: str) -> str:
    """Classify a single keyword's intent."""
    t_score = sum(1 for s in TRANSACTIONAL_SIGNALS if s in kw)
    c_score = sum(1 for s in COMMERCIAL_SIGNALS if s in kw)
    n_score = sum(1 for s in NAVIGATIONAL_SIGNALS if s in kw)
    i_score = sum(1 for s in INFORMATIONAL_SIGNALS if s in kw)

    # If no signals matched, check CPC-like heuristics from the keyword itself
    scores = {"transactional": t_score, "commercial": c_score, "navigational": n_score, "informational": i_score}
    best = max(scores, key=scores.get)  # type: ignore

    if scores[best] == 0:
        # Default: short keywords with product-like terms lean commercial
        product_terms = ["chart", "reading", "template", "workbook", "journal", "deck", "course", "app", "tool", "software", "planner"]
        if any(t in kw for t in product_terms):
            return "commercial"
        return "informational"

    return best


# ── Pain Point Extraction ──────────────────────────────────────────────────

PAIN_PHRASES = {
    "wish there was": 5,
    "i wish": 4,
    "frustrated": 5,
    "frustrating": 5,
    "annoying": 4,
    "disappointed": 4,
    "disappointing": 4,
    "doesn't work": 4,
    "doesn't have": 3,
    "missing feature": 4,
    "no good": 4,
    "looking for": 3,
    "need a": 3,
    "i need": 3,
    "hard to find": 3,
    "too expensive": 5,
    "overpriced": 5,
    "not worth": 4,
    "confusing": 3,
    "complicated": 3,
    "buggy": 4,
    "slow": 3,
    "ugly": 3,
    "outdated": 3,
    "inaccurate": 4,
    "limited": 3,
    "lacking": 3,
    "why can't": 4,
    "i can't find": 3,
    "alternative to": 3,
    "better than": 2,
    "anyone know": 2,
    "recommend": 2,
}

GAP_PHRASES = [
    "is there an app", "is there a tool", "does anyone know of",
    "i'd pay for", "i would pay", "willing to pay", "shut up and take my money",
    "someone should build", "someone needs to make", "why isn't there",
    "there should be", "if only there was",
]


def analyze_pain_points(texts: list[str], niche_name: str) -> dict:
    """Extract pain points from texts using frequency counting and pattern matching."""
    if not texts:
        return {}

    # Count pain phrase occurrences and collect matching quotes
    theme_data: dict[str, dict] = {}
    product_gaps: list[str] = []

    for text in texts[:100]:
        text_lower = text.lower()

        # Check pain phrases
        for phrase, intensity in PAIN_PHRASES.items():
            if phrase in text_lower:
                if phrase not in theme_data:
                    theme_data[phrase] = {"intensity": intensity, "count": 0, "quotes": []}
                theme_data[phrase]["count"] += 1
                # Keep up to 3 example quotes per theme
                if len(theme_data[phrase]["quotes"]) < 3:
                    # Extract a short snippet around the phrase
                    snippet = _extract_snippet(text, phrase, max_len=150)
                    if snippet:
                        theme_data[phrase]["quotes"].append(snippet)

        # Check for product gap signals
        for gap_phrase in GAP_PHRASES:
            if gap_phrase in text_lower:
                snippet = _extract_snippet(text, gap_phrase, max_len=120)
                if snippet and snippet not in product_gaps:
                    product_gaps.append(snippet)

    # Convert to structured themes, sorted by frequency * intensity
    pain_themes = []
    for phrase, data in sorted(theme_data.items(), key=lambda x: x[1]["count"] * x[1]["intensity"], reverse=True)[:10]:
        pain_themes.append({
            "theme": _humanize_phrase(phrase),
            "intensity": data["intensity"],
            "frequency": data["count"],
            "quotes": data["quotes"],
        })

    return {
        "pain_themes": pain_themes,
        "product_gaps": product_gaps[:5],
    }


def _extract_snippet(text: str, phrase: str, max_len: int = 150) -> str:
    """Extract a short snippet of text around a phrase."""
    idx = text.lower().find(phrase)
    if idx == -1:
        return ""
    start = max(0, idx - 30)
    end = min(len(text), idx + len(phrase) + max_len - 30)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet


def _humanize_phrase(phrase: str) -> str:
    """Convert a detection phrase to a readable theme title."""
    mapping = {
        "wish there was": "Unmet needs — users wish for something",
        "i wish": "Unmet desires",
        "frustrated": "User frustration",
        "frustrating": "Frustrating experience",
        "annoying": "Annoying pain points",
        "disappointed": "Disappointment with existing options",
        "disappointing": "Disappointing products",
        "doesn't work": "Broken functionality",
        "doesn't have": "Missing features",
        "missing feature": "Missing features",
        "no good": "Lack of quality options",
        "looking for": "Active search for solutions",
        "need a": "Expressed needs",
        "i need": "Direct needs",
        "hard to find": "Discovery problem",
        "too expensive": "Price sensitivity",
        "overpriced": "Perceived overpricing",
        "not worth": "Poor value perception",
        "confusing": "Usability issues — confusing",
        "complicated": "Complexity barrier",
        "buggy": "Technical quality issues",
        "slow": "Performance issues",
        "ugly": "Design quality issues",
        "outdated": "Outdated solutions",
        "inaccurate": "Accuracy concerns",
        "limited": "Limited functionality",
        "lacking": "Feature gaps",
        "why can't": "Feature expectations",
        "i can't find": "Discovery failure",
        "alternative to": "Seeking alternatives",
        "better than": "Comparison shopping",
        "anyone know": "Information seeking",
        "recommend": "Recommendation seeking",
    }
    return mapping.get(phrase, phrase.title())


# ── Product Landscape Analysis ─────────────────────────────────────────────

def analyze_product_landscape(products: list[dict], niche_name: str) -> dict:
    """Analyze product landscape using pure aggregation — no LLM."""
    if not products:
        return {}

    prices = [p["price"] for p in products if p["price"] > 0]
    formats = Counter(p["product_type"] for p in products if p.get("product_type"))
    platforms = Counter(p["platform"] for p in products)
    revenues = [p.get("estimated_revenue", 0) for p in products]

    # Find dominant format
    dominant_format = formats.most_common(1)[0][0] if formats else "unknown"

    # Price sweet spot — middle 50% range
    if prices:
        prices_sorted = sorted(prices)
        q1_idx = len(prices_sorted) // 4
        q3_idx = (len(prices_sorted) * 3) // 4
        price_low = prices_sorted[q1_idx] if q1_idx < len(prices_sorted) else 0
        price_high = prices_sorted[q3_idx] if q3_idx < len(prices_sorted) else 0
        price_sweet_spot = f"${price_low:.0f}-${price_high:.0f}"
    else:
        price_sweet_spot = "Unknown"

    # Underserved formats — formats with <3 products
    all_formats = {"course", "workbook", "template", "ebook", "app", "service", "journal", "audio", "cards", "print"}
    existing_formats = set(formats.keys())
    underserved = list(all_formats - existing_formats)
    # Also include formats with very few products
    for fmt, count in formats.items():
        if count <= 2 and fmt not in underserved:
            underserved.append(fmt)

    # Biggest gap — format with 0 products or the least-served format
    if underserved:
        biggest_gap = f"No {underserved[0]} products found in {niche_name}"
    else:
        least = formats.most_common()[-1] if formats else None
        biggest_gap = f"Few {least[0]} products ({least[1]} found)" if least else "Market appears saturated"

    # Market summary from data
    total_products = len(products)
    total_revenue = sum(revenues)
    avg_price = sum(prices) / len(prices) if prices else 0
    platform_str = ", ".join(f"{p}({c})" for p, c in platforms.most_common())

    market_summary = (
        f"{total_products} products found across {platform_str}. "
        f"Average price ${avg_price:.0f}, estimated total market revenue ${total_revenue:,.0f}."
    )

    recommendation = (
        f"The dominant format is {dominant_format}. "
        f"Price in the {price_sweet_spot} range. "
        f"Consider underserved formats: {', '.join(underserved[:3])}."
        if underserved else
        f"The dominant format is {dominant_format}. Price in the {price_sweet_spot} range."
    )

    return {
        "market_summary": market_summary,
        "dominant_format": dominant_format,
        "price_sweet_spot": price_sweet_spot,
        "underserved_formats": underserved[:5],
        "biggest_gap": biggest_gap,
        "recommendation": recommendation,
    }


# ── Opportunity Brief ──────────────────────────────────────────────────────

def generate_opportunity_brief(keyword: str, data: dict) -> str:
    """Generate a data-driven opportunity brief — no LLM, just facts."""
    volume = data.get("volume", 0)
    growth = data.get("growth", 0)
    avg_price = data.get("avg_price", 0)
    product_count = data.get("product_count", 0)
    difficulty = data.get("difficulty", 0)
    demand = data.get("demand_score", 0)
    wtp = data.get("wtp_score", 0)
    gap = data.get("gap_score", 0)
    pain_points = data.get("pain_points", [])

    # Determine format suggestion based on gap analysis
    if avg_price > 50:
        fmt = "course"
        price = f"${int(avg_price * 0.8)}-${int(avg_price * 1.2)}"
    elif avg_price > 20:
        fmt = "interactive tool or workbook"
        price = f"${int(avg_price * 0.8)}-${int(avg_price * 1.2)}"
    elif avg_price > 0:
        fmt = "template or digital download"
        price = f"${int(max(avg_price * 0.8, 5))}-${int(avg_price * 1.5)}"
    else:
        fmt = "digital product"
        price = "$15-$30"

    # Channel based on product count
    if product_count < 10:
        channel = "Gumroad — low competition, direct audience"
    elif product_count < 30:
        channel = "Gumroad + Etsy — moderate competition"
    else:
        channel = "Own site — crowded marketplaces, differentiate with branding"

    # Risk assessment from data
    risks = []
    if difficulty > 70:
        risks.append(f"High SERP difficulty ({difficulty}/100) makes organic discovery hard")
    if product_count > 40:
        risks.append(f"Crowded market ({product_count} existing products)")
    if volume < 500:
        risks.append(f"Low search volume ({volume}/mo) limits organic reach")
    if growth < 0:
        risks.append(f"Declining trend ({growth:.0f}% YoY)")
    if not risks:
        risks.append("No major red flags in data")

    # Summary from actual scores
    strength = "demand" if demand >= wtp and demand >= gap else "willingness to pay" if wtp >= gap else "market gap"
    pain_str = f" Pain points: {', '.join(pain_points[:3])}." if pain_points else ""

    brief = {
        "what_to_build": f"A {fmt} targeting '{keyword}' searchers.{pain_str}",
        "why_it_works": f"{volume:,} monthly searches, {growth:+.0f}% growth, strongest signal is {strength} ({max(demand, wtp, gap):.0f}/100).",
        "price": price,
        "format": fmt,
        "launch_channel": channel,
        "build_time": "Data insufficient to estimate — depends on your stack",
        "risk": risks[0],
        "summary": (
            f"'{keyword}' has {volume:,} vol/mo at {growth:+.0f}% growth. "
            f"{product_count} competitors at ${avg_price:.0f} avg. "
            f"SERP difficulty {difficulty}/100. {risks[0]}."
        ),
    }

    return json.dumps(brief)
