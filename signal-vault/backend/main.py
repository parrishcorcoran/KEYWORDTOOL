"""Signal Vault — FastAPI backend for personal market intelligence dashboard."""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import FRONTEND_URL, NICHES, PORT
from database import get_db, init_db
from models import Keyword, Opportunity, PainPoint, Product, RedditPost, ScanLog, SerpResult
from scanner import active_scans, run_full_scan


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Signal Vault", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "signal-vault", "timestamp": datetime.now(timezone.utc).isoformat()}


# ── Niches ──────────────────────────────────────────────────────────────────

@app.get("/niches")
def list_niches(db: Session = Depends(get_db)):
    result = []
    for niche_id, niche in NICHES.items():
        last_scan = db.query(ScanLog).filter(
            ScanLog.niche_id == niche_id, ScanLog.status == "completed"
        ).order_by(ScanLog.completed_at.desc()).first()

        opp_count = db.query(Opportunity).filter(Opportunity.niche_id == niche_id).count()

        # Get overall trend from keywords
        keywords = db.query(Keyword).filter(Keyword.niche_id == niche_id).all()
        growing = sum(1 for k in keywords if k.trend_direction in ("growing", "exploding"))
        declining = sum(1 for k in keywords if k.trend_direction == "declining")
        if growing > declining * 2:
            trend = "growing"
        elif declining > growing * 2:
            trend = "declining"
        else:
            trend = "stable"

        scan_status = active_scans.get(niche_id, "idle")

        result.append({
            "id": niche_id,
            "name": niche["name"],
            "last_scanned": last_scan.completed_at.isoformat() if last_scan and last_scan.completed_at else None,
            "opportunity_count": opp_count,
            "trend": trend,
            "scan_status": scan_status,
            "keyword_count": len(keywords),
        })
    return result


@app.get("/niche/{niche_id}")
def get_niche(niche_id: str, db: Session = Depends(get_db)):
    if niche_id not in NICHES:
        raise HTTPException(status_code=404, detail="Niche not found")

    niche_config = NICHES[niche_id]
    keywords = db.query(Keyword).filter(Keyword.niche_id == niche_id).order_by(Keyword.volume.desc()).all()
    products = db.query(Product).filter(Product.niche_id == niche_id).order_by(Product.estimated_revenue.desc()).all()
    pain_points = db.query(PainPoint).filter(PainPoint.niche_id == niche_id).order_by(PainPoint.intensity.desc()).all()
    reddit_posts = db.query(RedditPost).filter(RedditPost.niche_id == niche_id).order_by(RedditPost.score.desc()).all()
    serp_results = db.query(SerpResult).filter(SerpResult.niche_id == niche_id).all()
    opportunities = db.query(Opportunity).filter(Opportunity.niche_id == niche_id).order_by(Opportunity.overall_score.desc()).all()
    last_scan = db.query(ScanLog).filter(
        ScanLog.niche_id == niche_id, ScanLog.status == "completed"
    ).order_by(ScanLog.completed_at.desc()).first()

    # Get AI landscape from first product
    ai_landscape = {}
    first_prod = db.query(Product).filter(Product.niche_id == niche_id, Product.ai_landscape != None).first()
    if first_prod and first_prod.ai_landscape:
        ai_landscape = first_prod.ai_landscape

    return {
        "id": niche_id,
        "name": niche_config["name"],
        "scan_status": active_scans.get(niche_id, "idle"),
        "last_scanned": last_scan.completed_at.isoformat() if last_scan and last_scan.completed_at else None,
        "keywords": [_serialize_keyword(k) for k in keywords],
        "products": [_serialize_product(p) for p in products],
        "pain_points": [_serialize_pain_point(pp) for pp in pain_points],
        "reddit_posts": [_serialize_reddit_post(rp) for rp in reddit_posts],
        "serp_results": [_serialize_serp(s) for s in serp_results],
        "opportunities": [_serialize_opportunity(o) for o in opportunities],
        "ai_landscape": ai_landscape,
    }


# ── Scanning ────────────────────────────────────────────────────────────────

def _run_scan_background(niche_id: str):
    """Wrapper to run async scan in background thread."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        asyncio.run(run_full_scan(niche_id, db))
    except Exception as e:
        active_scans[niche_id] = "failed"
        # Log to scan_logs table so the error is visible
        try:
            from models import ScanLog
            log = ScanLog(niche_id=niche_id, scan_type="full", status="failed", error_message=str(e)[:500])
            db.add(log)
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


@app.post("/scan/{niche_id}")
def start_scan(niche_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if niche_id not in NICHES:
        raise HTTPException(status_code=404, detail="Niche not found")
    if active_scans.get(niche_id) == "running":
        raise HTTPException(status_code=409, detail="Scan already running for this niche")

    active_scans[niche_id] = "running"
    background_tasks.add_task(_run_scan_background, niche_id)
    return {"status": "started", "niche_id": niche_id}


@app.post("/scan/all")
def start_all_scans(background_tasks: BackgroundTasks):
    started = []
    for niche_id in NICHES:
        if active_scans.get(niche_id) != "running":
            active_scans[niche_id] = "running"
            background_tasks.add_task(_run_scan_background, niche_id)
            started.append(niche_id)
    return {"status": "started", "niches": started}


# ── Opportunities ───────────────────────────────────────────────────────────

@app.get("/opportunities")
def list_opportunities(db: Session = Depends(get_db)):
    opps = db.query(Opportunity).order_by(Opportunity.overall_score.desc()).all()
    return [_serialize_opportunity(o) for o in opps]


# ── Serializers ─────────────────────────────────────────────────────────────

def _serialize_keyword(k: Keyword) -> dict:
    return {
        "id": k.id, "keyword": k.keyword, "volume": k.volume, "cpc": k.cpc,
        "competition": k.competition, "intent": k.intent, "trend_direction": k.trend_direction,
        "growth_pct_yoy": k.growth_pct_yoy, "seasonality": k.seasonality,
        "trend_data": k.trend_data or [], "autocomplete_present": k.autocomplete_present,
    }


def _serialize_product(p: Product) -> dict:
    return {
        "id": p.id, "platform": p.platform, "title": p.title, "price": p.price,
        "price_model": p.price_model, "review_count": p.review_count,
        "sales_count": p.sales_count, "rating": p.rating,
        "estimated_revenue": p.estimated_revenue, "seller": p.seller,
        "url": p.url, "product_type": p.product_type,
    }


def _serialize_pain_point(pp: PainPoint) -> dict:
    return {
        "id": pp.id, "theme": pp.theme, "frequency": pp.frequency,
        "intensity": pp.intensity, "example_quotes": pp.example_quotes or [],
        "source": pp.source,
    }


def _serialize_reddit_post(rp: RedditPost) -> dict:
    return {
        "id": rp.id, "subreddit": rp.subreddit, "title": rp.title,
        "body": rp.body[:200] if rp.body else "", "score": rp.score,
        "comment_count": rp.comment_count, "url": rp.url,
        "has_purchase_intent": rp.has_purchase_intent,
    }


def _serialize_serp(s: SerpResult) -> dict:
    return {
        "id": s.id, "keyword": s.keyword, "difficulty": s.difficulty,
        "results": s.results or [], "has_featured_snippet": s.has_featured_snippet,
        "has_ai_overview": s.has_ai_overview,
    }


def _serialize_opportunity(o: Opportunity) -> dict:
    return {
        "id": o.id, "niche_id": o.niche_id, "keyword": o.keyword,
        "overall_score": o.overall_score, "demand_score": o.demand_score,
        "wtp_score": o.wtp_score, "gap_score": o.gap_score,
        "feasibility_score": o.feasibility_score, "timing_score": o.timing_score,
        "confidence": o.confidence, "ai_brief": o.ai_brief,
        "volume": o.volume, "growth": o.growth, "avg_price": o.avg_price,
        "product_count": o.product_count, "difficulty": o.difficulty,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
