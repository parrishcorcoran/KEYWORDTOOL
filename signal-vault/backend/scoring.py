"""Scoring engine for Signal Vault — equal-weighted composite scores per Dawes (1979)."""


def normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalize value to 0-100 range."""
    if max_val <= min_val:
        return 0.0
    return max(0.0, min(100.0, ((value - min_val) / (max_val - min_val)) * 100))


def demand_score(volume: int, growth: float, intent: str) -> float:
    """Score demand from search volume, growth rate, and intent."""
    vol_score = normalize(volume, 0, 50000) * 0.5
    growth_score = normalize(growth, 0, 100) * 0.3
    intent_bonus = {"transactional": 20, "commercial": 15, "navigational": 5}.get(intent, 0)
    return min(100, vol_score + growth_score + intent_bonus)


def wtp_score(market_size: float, avg_price: float, product_count: int) -> float:
    """Score willingness to pay from market revenue, avg price, product count."""
    market_score = normalize(market_size, 0, 500000) * 0.4
    price_score = normalize(avg_price, 0, 100) * 0.3
    count_score = normalize(product_count, 0, 50) * 0.3
    return min(100, market_score + price_score + count_score)


def gap_score(pain_intensity: float, interactive_app_count: int, feature_request_count: int) -> float:
    """Score market gap from pain intensity, existing apps, and unmet requests."""
    pain_score = normalize(pain_intensity, 0, 5) * 0.4
    if interactive_app_count < 3:
        app_gap = 40
    elif interactive_app_count < 5:
        app_gap = 20
    else:
        app_gap = 0
    request_score = normalize(feature_request_count, 0, 20) * 0.2
    return min(100, pain_score + app_gap + request_score)


def feasibility_score(difficulty: int, has_ai_overview: bool) -> float:
    """Score feasibility from SERP difficulty and AI overview presence."""
    score = 100.0 - difficulty
    if has_ai_overview:
        score -= 15
    return max(0, min(100, score))


def timing_score(trend_direction: str) -> float:
    """Score timing from trend direction."""
    return {"exploding": 100, "growing": 75, "stable": 40, "declining": 10}.get(trend_direction, 40)


def compute_opportunity_score(
    volume: int, growth: float, intent: str,
    market_size: float, avg_price: float, product_count: int,
    pain_intensity: float, interactive_app_count: int, feature_request_count: int,
    difficulty: int, has_ai_overview: bool,
    trend_direction: str,
) -> dict:
    """Compute full opportunity score with all sub-scores."""
    d = demand_score(volume, growth, intent)
    w = wtp_score(market_size, avg_price, product_count)
    g = gap_score(pain_intensity, interactive_app_count, feature_request_count)
    f = feasibility_score(difficulty, has_ai_overview)
    t = timing_score(trend_direction)

    overall = (d + w + g + f + t) / 5.0

    # Confidence based on non-zero data points
    data_points = sum([
        1 if volume > 0 else 0,
        1 if market_size > 0 else 0,
        1 if pain_intensity > 0 else 0,
        1 if difficulty > 0 else 0,
        1 if trend_direction != "stable" else 0,
    ])
    confidence_map = {0: "very_low", 1: "low", 2: "medium", 3: "high", 4: "very_high", 5: "very_high"}
    confidence = confidence_map.get(data_points, "low")

    return {
        "overall_score": round(overall, 1),
        "demand_score": round(d, 1),
        "wtp_score": round(w, 1),
        "gap_score": round(g, 1),
        "feasibility_score": round(f, 1),
        "timing_score": round(t, 1),
        "confidence": confidence,
    }


def classify_trend(trend_data: list[int], growth_pct: float) -> str:
    """Classify trend direction from monthly data and growth percentage."""
    if not trend_data or len(trend_data) < 3:
        if growth_pct > 50:
            return "growing"
        elif growth_pct < -20:
            return "declining"
        return "stable"

    recent = trend_data[:3]
    older = trend_data[-3:] if len(trend_data) >= 6 else trend_data[3:]
    avg_recent = sum(recent) / len(recent) if recent else 0
    avg_older = sum(older) / len(older) if older else 1

    if avg_older == 0:
        return "growing" if avg_recent > 0 else "stable"

    change = (avg_recent - avg_older) / avg_older * 100

    if change > 100:
        return "exploding"
    elif change > 20:
        return "growing"
    elif change < -20:
        return "declining"
    return "stable"


def compute_growth_pct(trend_data: list[int]) -> float:
    """Compute year-over-year growth percentage from monthly trend data."""
    if not trend_data or len(trend_data) < 6:
        return 0.0
    recent = trend_data[:3]
    older = trend_data[-3:]
    avg_recent = sum(recent) / len(recent) if recent else 0
    avg_older = sum(older) / len(older) if older else 0
    if avg_older == 0:
        return 100.0 if avg_recent > 0 else 0.0
    return round(((avg_recent - avg_older) / avg_older) * 100, 1)
