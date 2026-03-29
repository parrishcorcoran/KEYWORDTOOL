from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from database import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    keyword = Column(String, nullable=False)
    volume = Column(Integer, default=0)
    cpc = Column(Float, default=0.0)
    competition = Column(Float, default=0.0)
    intent = Column(String, default="informational")
    trend_direction = Column(String, default="stable")  # growing, declining, stable, exploding
    growth_pct_yoy = Column(Float, default=0.0)
    seasonality = Column(String, default="")
    trend_data = Column(JSON, default=list)  # monthly volume array
    autocomplete_present = Column(Boolean, default=False)
    confidence = Column(String, default="low")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    platform = Column(String, nullable=False)  # gumroad, etsy, appstore
    title = Column(String, nullable=False)
    price = Column(Float, default=0.0)
    price_model = Column(String, default="one-time")
    review_count = Column(Integer, default=0)
    sales_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    estimated_revenue = Column(Float, default=0.0)
    seller = Column(String, default="")
    url = Column(String, default="")
    product_type = Column(String, default="")
    ai_landscape = Column(JSON, default=dict)


class PainPoint(Base):
    __tablename__ = "pain_points"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    theme = Column(String, nullable=False)
    frequency = Column(Integer, default=1)
    intensity = Column(Integer, default=1)  # 1-5
    example_quotes = Column(JSON, default=list)
    source = Column(String, default="")


class RedditPost(Base):
    __tablename__ = "reddit_posts"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    subreddit = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text, default="")
    score = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    url = Column(String, default="")
    has_purchase_intent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SerpResult(Base):
    __tablename__ = "serp_results"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    keyword = Column(String, nullable=False)
    difficulty = Column(Integer, default=0)
    results = Column(JSON, default=list)
    has_featured_snippet = Column(Boolean, default=False)
    has_ai_overview = Column(Boolean, default=False)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    keyword = Column(String, nullable=False)
    overall_score = Column(Float, default=0.0)
    demand_score = Column(Float, default=0.0)
    wtp_score = Column(Float, default=0.0)
    gap_score = Column(Float, default=0.0)
    feasibility_score = Column(Float, default=0.0)
    timing_score = Column(Float, default=0.0)
    confidence = Column(String, default="low")
    ai_brief = Column(Text, default="")
    volume = Column(Integer, default=0)
    growth = Column(Float, default=0.0)
    avg_price = Column(Float, default=0.0)
    product_count = Column(Integer, default=0)
    difficulty = Column(Integer, default=0)


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(String, index=True, nullable=False)
    scan_type = Column(String, default="full")
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    error_message = Column(Text, default="")
