export interface NicheSummary {
  id: string
  name: string
  last_scanned: string | null
  opportunity_count: number
  trend: 'growing' | 'declining' | 'stable'
  scan_status: string
  keyword_count: number
}

export interface KeywordData {
  id: number
  keyword: string
  volume: number
  cpc: number
  competition: number
  intent: string
  trend_direction: string
  growth_pct_yoy: number
  seasonality: string
  trend_data: number[]
  autocomplete_present: boolean
}

export interface ProductData {
  id: number
  platform: string
  title: string
  price: number
  price_model: string
  review_count: number
  sales_count: number
  rating: number
  estimated_revenue: number
  seller: string
  url: string
  product_type: string
}

export interface PainPointData {
  id: number
  theme: string
  frequency: number
  intensity: number
  example_quotes: string[]
  source: string
}

export interface RedditPostData {
  id: number
  subreddit: string
  title: string
  body: string
  score: number
  comment_count: number
  url: string
  has_purchase_intent: boolean
}

export interface SerpData {
  id: number
  keyword: string
  difficulty: number
  results: { url: string; domain: string; title: string; rank: number }[]
  has_featured_snippet: boolean
  has_ai_overview: boolean
}

export interface OpportunityData {
  id: number
  niche_id: string
  keyword: string
  overall_score: number
  demand_score: number
  wtp_score: number
  gap_score: number
  feasibility_score: number
  timing_score: number
  confidence: string
  ai_brief: string
  volume: number
  growth: number
  avg_price: number
  product_count: number
  difficulty: number
}

export interface NicheDetail {
  id: string
  name: string
  scan_status: string
  last_scanned: string | null
  keywords: KeywordData[]
  products: ProductData[]
  pain_points: PainPointData[]
  reddit_posts: RedditPostData[]
  serp_results: SerpData[]
  opportunities: OpportunityData[]
  ai_landscape: Record<string, string>
}
