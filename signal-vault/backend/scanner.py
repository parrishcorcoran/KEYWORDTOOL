"""Full scan pipeline for Signal Vault — orchestrates all data collection and scoring."""

import asyncio
import json
import time
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from config import NICHES
from models import Keyword, Product, PainPoint, RedditPost, SerpResult, Opportunity, ScanLog
from data_sources import (
    dataforseo_keyword_suggestions, dataforseo_trends, dataforseo_serp,
    google_autocomplete, scrape_gumroad, scrape_etsy, search_appstore,
    fetch_reddit_posts, search_reddit,
)
from intelligence import classify_intents, analyze_pain_points, generate_opportunity_brief, analyze_product_landscape
from scoring import compute_opportunity_score, classify_trend, compute_growth_pct

# Track active scans
active_scans: dict[str, str] = {}  # niche_id -> status


async def run_full_scan(niche_id: str, db: Session):
    """Run a complete scan pipeline for a niche."""
    if niche_id not in NICHES:
        raise ValueError(f"Unknown niche: {niche_id}")

    niche = NICHES[niche_id]
    active_scans[niche_id] = "running"
    start_time = time.time()

    # Create scan log
    scan_log = ScanLog(niche_id=niche_id, scan_type="full", status="running")
    db.add(scan_log)
    db.commit()
    db.refresh(scan_log)

    try:
        # Clear old data for this niche
        for model in [Keyword, Product, PainPoint, RedditPost, SerpResult, Opportunity]:
            db.query(model).filter(model.niche_id == niche_id).delete()
        db.commit()

        async with httpx.AsyncClient() as client:
            # ── Module 1: DEMAND ────────────────────────────────────
            keywords_data = await _scan_demand(niche, client)

            # Save keywords
            intent_map = classify_intents([k["keyword"] for k in keywords_data[:30]])
            autocomplete_kws = set()
            for kw in niche["seed_keywords"][:10]:
                suggestions = await google_autocomplete(kw, client)
                autocomplete_kws.update(s.lower() for s in suggestions)
                await asyncio.sleep(0.5)

            for kd in keywords_data:
                trend_dir = classify_trend(kd.get("trend_data", []), kd.get("growth_pct_yoy", 0))
                growth = compute_growth_pct(kd.get("trend_data", []))
                db_kw = Keyword(
                    niche_id=niche_id,
                    keyword=kd["keyword"],
                    volume=kd.get("volume", 0),
                    cpc=kd.get("cpc", 0),
                    competition=kd.get("competition", 0),
                    intent=intent_map.get(kd["keyword"], "informational"),
                    trend_direction=trend_dir,
                    growth_pct_yoy=growth,
                    trend_data=kd.get("trend_data", []),
                    autocomplete_present=kd["keyword"].lower() in autocomplete_kws,
                )
                db.add(db_kw)
            db.commit()

            # ── Module 2: PRODUCTS ──────────────────────────────────
            products = await _scan_products(niche, client)
            for p in products:
                db_prod = Product(niche_id=niche_id, **p)
                db.add(db_prod)
            db.commit()

            # Claude landscape analysis
            if products:
                landscape = analyze_product_landscape(
                    [{"title": p["title"], "price": p["price"], "platform": p["platform"],
                      "estimated_revenue": p["estimated_revenue"], "product_type": p["product_type"]}
                     for p in products[:30]],
                    niche["name"]
                )
                if landscape:
                    first_prod = db.query(Product).filter(Product.niche_id == niche_id).first()
                    if first_prod:
                        first_prod.ai_landscape = landscape
                        db.commit()

            # ── Module 3: PAIN POINTS ───────────────────────────────
            reddit_posts, pain_texts = await _scan_pain_points(niche, client)
            for rp in reddit_posts:
                db_post = RedditPost(
                    niche_id=niche_id,
                    subreddit=rp["subreddit"],
                    title=rp["title"],
                    body=rp["body"],
                    score=rp["score"],
                    comment_count=rp["comment_count"],
                    url=rp["url"],
                    has_purchase_intent=rp["has_purchase_intent"],
                )
                db.add(db_post)
            db.commit()

            # Claude pain analysis
            if pain_texts:
                pain_analysis = analyze_pain_points(pain_texts[:50], niche["name"])
                for theme_data in pain_analysis.get("pain_themes", []):
                    db_pain = PainPoint(
                        niche_id=niche_id,
                        theme=theme_data.get("theme", "Unknown"),
                        frequency=theme_data.get("frequency", 1),
                        intensity=theme_data.get("intensity", 1),
                        example_quotes=theme_data.get("quotes", []),
                        source="reddit+reviews",
                    )
                    db.add(db_pain)
                # Also store product gaps as pain points
                for gap in pain_analysis.get("product_gaps", []):
                    db_pain = PainPoint(
                        niche_id=niche_id,
                        theme=gap if isinstance(gap, str) else str(gap),
                        frequency=1,
                        intensity=3,
                        example_quotes=[],
                        source="ai_analysis",
                    )
                    db.add(db_pain)
                db.commit()

            # ── Module 4: COMPETITORS / SERP ────────────────────────
            commercial_kws = [k["keyword"] for k in keywords_data if intent_map.get(k["keyword"]) in ("commercial", "transactional")][:10]
            if not commercial_kws:
                commercial_kws = [k["keyword"] for k in keywords_data[:5]]
            for kw in commercial_kws:
                serp_data = await dataforseo_serp(kw, client)
                db_serp = SerpResult(
                    niche_id=niche_id,
                    keyword=serp_data["keyword"],
                    difficulty=serp_data["difficulty"],
                    results=serp_data["results"],
                    has_featured_snippet=serp_data["has_featured_snippet"],
                    has_ai_overview=serp_data["has_ai_overview"],
                )
                db.add(db_serp)
                await asyncio.sleep(1)
            db.commit()

            # ── Module 5: SCORING ───────────────────────────────────
            await _score_opportunities(niche_id, db, pain_analysis if pain_texts else {})

        # Update scan log
        duration = time.time() - start_time
        scan_log.status = "completed"
        scan_log.completed_at = datetime.now(timezone.utc)
        scan_log.duration_seconds = duration
        db.commit()
        active_scans[niche_id] = "completed"

    except Exception as e:
        duration = time.time() - start_time
        scan_log.status = "failed"
        scan_log.completed_at = datetime.now(timezone.utc)
        scan_log.duration_seconds = duration
        scan_log.error_message = str(e)[:500]
        db.commit()
        active_scans[niche_id] = "failed"
        raise


async def _scan_demand(niche: dict, client: httpx.AsyncClient) -> list[dict]:
    """Module 1: Collect keyword data from DataForSEO + Google Autocomplete."""
    keywords_data = await dataforseo_keyword_suggestions(niche["seed_keywords"], client)

    # Get trends for seed keywords
    trends = await dataforseo_trends(niche["seed_keywords"][:10], client)
    trends_lookup = {k.lower(): v for k, v in trends.items()}

    # Merge trends into keyword data
    for kd in keywords_data:
        kw_lower = kd["keyword"].lower()
        if kw_lower in trends_lookup:
            kd["trend_data"] = trends_lookup[kw_lower]

    # If no DataForSEO data, create entries from seed keywords
    if not keywords_data:
        keywords_data = [{"keyword": kw, "volume": 0, "cpc": 0, "competition": 0, "trend_data": []} for kw in niche["seed_keywords"]]

    return keywords_data


async def _scan_products(niche: dict, client: httpx.AsyncClient) -> list[dict]:
    """Module 2: Scrape products from Gumroad, Etsy, App Store."""
    all_products = []

    for term in niche.get("gumroad_terms", [])[:3]:
        products = await scrape_gumroad(term, client)
        all_products.extend(products)
        await asyncio.sleep(2)

    for term in niche.get("etsy_terms", [])[:3]:
        products = await scrape_etsy(term, client)
        all_products.extend(products)
        await asyncio.sleep(2)

    for term in niche.get("appstore_terms", [])[:3]:
        products = await search_appstore(term, client)
        all_products.extend(products)
        await asyncio.sleep(1)

    return all_products


async def _scan_pain_points(niche: dict, client: httpx.AsyncClient) -> tuple[list[dict], list[str]]:
    """Module 3: Reddit posts + review mining."""
    all_posts = []
    pain_texts = []

    for sub in niche.get("subreddits", []):
        posts = await fetch_reddit_posts(sub, client)
        all_posts.extend(posts)
        pain_texts.extend([f"{p['title']} {p['body']}" for p in posts if p.get("body")])
        await asyncio.sleep(2)

        # Also search for purchase intent
        for term in niche["seed_keywords"][:3]:
            search_posts = await search_reddit(sub, term, client)
            for sp in search_posts:
                if sp["url"] not in {p["url"] for p in all_posts}:
                    all_posts.append(sp)
                    if sp.get("body"):
                        pain_texts.append(f"{sp['title']} {sp['body']}")
            await asyncio.sleep(2)

    return all_posts, pain_texts


async def _score_opportunities(niche_id: str, db: Session, pain_analysis: dict):
    """Module 5: Score top keywords as opportunities."""
    keywords = db.query(Keyword).filter(Keyword.niche_id == niche_id).order_by(Keyword.volume.desc()).limit(20).all()
    products = db.query(Product).filter(Product.niche_id == niche_id).all()
    serp_results = db.query(SerpResult).filter(SerpResult.niche_id == niche_id).all()
    pain_points = db.query(PainPoint).filter(PainPoint.niche_id == niche_id).all()

    # Aggregate product metrics
    total_revenue = sum(p.estimated_revenue for p in products)
    avg_price = sum(p.price for p in products) / len(products) if products else 0
    app_count = sum(1 for p in products if p.product_type == "app")
    avg_pain = sum(pp.intensity for pp in pain_points) / len(pain_points) if pain_points else 0
    feature_requests = len([pp for pp in pain_points if pp.source == "ai_analysis"])

    # SERP difficulty lookup
    serp_lookup = {s.keyword.lower(): s for s in serp_results}

    for kw in keywords:
        serp = serp_lookup.get(kw.keyword.lower())
        difficulty = serp.difficulty if serp else 50
        has_ai = serp.has_ai_overview if serp else False

        scores = compute_opportunity_score(
            volume=kw.volume,
            growth=kw.growth_pct_yoy,
            intent=kw.intent,
            market_size=total_revenue,
            avg_price=avg_price,
            product_count=len(products),
            pain_intensity=avg_pain,
            interactive_app_count=app_count,
            feature_request_count=feature_requests,
            difficulty=difficulty,
            has_ai_overview=has_ai,
            trend_direction=kw.trend_direction,
        )

        # Generate AI brief for high scorers
        ai_brief = ""
        if scores["overall_score"] >= 40:
            brief_data = {
                "volume": kw.volume,
                "growth": kw.growth_pct_yoy,
                "avg_price": round(avg_price, 2),
                "product_count": len(products),
                "difficulty": difficulty,
                "demand_score": scores["demand_score"],
                "wtp_score": scores["wtp_score"],
                "gap_score": scores["gap_score"],
                "pain_points": [pp.theme for pp in pain_points[:5]],
            }
            ai_brief = generate_opportunity_brief(kw.keyword, brief_data)

        opp = Opportunity(
            niche_id=niche_id,
            keyword=kw.keyword,
            overall_score=scores["overall_score"],
            demand_score=scores["demand_score"],
            wtp_score=scores["wtp_score"],
            gap_score=scores["gap_score"],
            feasibility_score=scores["feasibility_score"],
            timing_score=scores["timing_score"],
            confidence=scores["confidence"],
            ai_brief=ai_brief,
            volume=kw.volume,
            growth=kw.growth_pct_yoy,
            avg_price=round(avg_price, 2),
            product_count=len(products),
            difficulty=difficulty,
        )
        db.add(opp)

    db.commit()
