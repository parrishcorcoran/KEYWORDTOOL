"""Claude intelligence layer for Signal Vault — intent classification, pain analysis, opportunity briefs."""

import json
import re

import anthropic

from config import ANTHROPIC_API_KEY

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


def _clean_json(text: str) -> str:
    """Strip markdown fences and extract JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _call_claude(prompt: str, system: str = "You are a market research analyst. Respond with valid JSON only, no markdown fences.") -> dict | list:
    """Call Claude and parse JSON response."""
    if not ANTHROPIC_API_KEY:
        return {}
    try:
        client = _get_client()
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text
        cleaned = _clean_json(raw)
        return json.loads(cleaned)
    except (json.JSONDecodeError, Exception):
        return {}


def classify_intents(keywords: list[str]) -> dict[str, str]:
    """Classify search intent for a batch of keywords."""
    if not keywords:
        return {}
    batch = keywords[:30]
    prompt = f"""Classify the search intent of each keyword. Return a JSON object mapping each keyword to its intent.
Intents: informational, commercial, transactional, navigational.

Keywords: {json.dumps(batch)}

Return format: {{"keyword": "intent", ...}}"""
    result = _call_claude(prompt)
    return result if isinstance(result, dict) else {}


def analyze_pain_points(texts: list[str], niche_name: str) -> dict:
    """Analyze reviews/posts for pain points and product gaps."""
    if not texts:
        return {}
    sample = texts[:50]
    prompt = f"""Analyze these user reviews and Reddit posts from the "{niche_name}" niche.

Texts:
{json.dumps(sample, indent=1)}

Return a JSON object with:
- "unmet_needs": [list of unmet needs mentioned, max 10]
- "purchase_triggers": [list of things that make people buy, max 5]
- "complaints": [list of common complaints, max 10]
- "format_preferences": [preferred product formats like "app", "course", "pdf", max 5]
- "price_signals": [mentions of price expectations or willingness to pay, max 5]
- "product_gaps": [specific product ideas that don't exist yet, max 5]
- "pain_themes": [
    {{"theme": "short theme title", "intensity": 1-5, "frequency": count_of_mentions, "quotes": ["quote1", "quote2"]}}
  ] (max 10 themes)"""
    return _call_claude(prompt)


def generate_opportunity_brief(keyword: str, data: dict) -> str:
    """Generate an actionable opportunity brief for a high-scoring keyword."""
    prompt = f"""You are a ruthlessly practical indie developer advisor. Generate a brief for this product opportunity.

Keyword: {keyword}
Volume: {data.get('volume', 0)}/mo
Growth: {data.get('growth', 0)}% YoY
Average competitor price: ${data.get('avg_price', 0)}
Number of competitors: {data.get('product_count', 0)}
SERP difficulty: {data.get('difficulty', 0)}/100
Demand score: {data.get('demand_score', 0)}/100
Willingness to pay score: {data.get('wtp_score', 0)}/100
Gap score: {data.get('gap_score', 0)}/100
Pain points: {json.dumps(data.get('pain_points', [])[:5])}

Return a JSON object:
{{
  "what_to_build": "Specific product description in 1-2 sentences",
  "why_it_works": "Why this will sell, 1-2 sentences",
  "price": "$XX",
  "format": "app/course/ebook/template/etc",
  "launch_channel": "Where to sell and promote",
  "build_time": "Estimated build time",
  "risk": "Main risk in 1 sentence",
  "summary": "2-3 sentence actionable summary combining all the above"
}}

Be blunt and specific. No corporate fluff."""
    result = _call_claude(prompt)
    if isinstance(result, dict):
        return json.dumps(result)
    return "{}"


def analyze_product_landscape(products: list[dict], niche_name: str) -> dict:
    """Analyze the product landscape for a niche."""
    if not products:
        return {}
    sample = products[:30]
    prompt = f"""Analyze this product landscape for the "{niche_name}" niche.

Products:
{json.dumps(sample, indent=1)}

Return a JSON object:
{{
  "market_summary": "2-3 sentence overview of the market",
  "dominant_format": "Most common product format",
  "price_sweet_spot": "$X-$Y range where most sales happen",
  "underserved_formats": ["formats with few products but demand"],
  "biggest_gap": "The most obvious missing product",
  "recommendation": "1-2 sentence actionable recommendation"
}}"""
    return _call_claude(prompt)
