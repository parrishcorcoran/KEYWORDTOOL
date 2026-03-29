import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import type { NicheDetail as NicheDetailType, KeywordData } from '../types'
import { useApiGet, apiFetch } from '../hooks/useApi'
import { SkeletonTable } from '../components/Skeleton'
import ScoreBadge from '../components/ScoreBadge'
import TrendArrow from '../components/TrendArrow'
import Sparkline from '../components/Sparkline'
import ConfidenceBadge from '../components/ConfidenceBadge'
import OpportunityCard from '../components/OpportunityCard'

const TABS = ['Demand', 'Products', 'Pain Points', 'Competitors', 'Opportunities'] as const
type TabName = typeof TABS[number]

const PLATFORM_COLORS: Record<string, string> = {
  gumroad: '#d4a843',
  etsy: '#f59e0b',
  appstore: '#7c6cf0',
}

const CHART_COLORS = ['#d4a843', '#7c6cf0', '#34d399', '#f59e0b', '#f43f5e', '#8b8a88']

export default function NicheDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: niche, loading, refetch } = useApiGet<NicheDetailType>(`/niche/${id}`)
  const [activeTab, setActiveTab] = useState<TabName>('Demand')
  const [sortKey, setSortKey] = useState<keyof KeywordData>('volume')
  const [sortAsc, setSortAsc] = useState(false)
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [trendFilter, setTrendFilter] = useState<string>('all')

  const handleScan = async () => {
    await apiFetch(`/scan/${id}`, { method: 'POST' })
    setTimeout(refetch, 3000)
  }

  const handleSort = (key: keyof KeywordData) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sortedKeywords = useMemo(() => {
    if (!niche) return []
    let filtered = [...niche.keywords]
    if (intentFilter !== 'all') filtered = filtered.filter(k => k.intent === intentFilter)
    if (trendFilter !== 'all') filtered = filtered.filter(k => k.trend_direction === trendFilter)
    filtered.sort((a, b) => {
      const va = a[sortKey] ?? 0
      const vb = b[sortKey] ?? 0
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return filtered
  }, [niche, sortKey, sortAsc, intentFilter, trendFilter])

  if (loading) return <div className="space-y-4"><SkeletonTable rows={8} /></div>
  if (!niche) return <div className="text-text-muted">Niche not found</div>

  // Product aggregations
  const formatBreakdown = niche.products.reduce<Record<string, number>>((acc, p) => {
    acc[p.product_type] = (acc[p.product_type] || 0) + 1
    return acc
  }, {})
  const platformBreakdown = niche.products.reduce<Record<string, number>>((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1
    return acc
  }, {})
  const priceTiers = niche.products.reduce<Record<string, number>>((acc, p) => {
    const tier = p.price <= 10 ? '$0-10' : p.price <= 25 ? '$10-25' : p.price <= 50 ? '$25-50' : p.price <= 100 ? '$50-100' : '$100+'
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, {})

  const intentBadgeColor: Record<string, string> = {
    transactional: 'bg-emerald/10 text-emerald',
    commercial: 'bg-gold/10 text-gold',
    informational: 'bg-violet/10 text-violet',
    navigational: 'bg-text-muted/10 text-text-muted',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-text-muted hover:text-gold transition-colors text-sm">{'\u2190'} Back</Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">{niche.name}</h1>
          {niche.scan_status === 'running' && (
            <span className="text-xs font-mono text-gold scanning">Scanning...</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {niche.last_scanned && (
            <span className="text-xs text-text-muted">Last: {new Date(niche.last_scanned).toLocaleString()}</span>
          )}
          <button onClick={handleScan} className="px-4 py-2 rounded-lg bg-gold/10 text-gold text-sm hover:bg-gold/20 transition-all duration-300">
            {niche.scan_status === 'running' ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-body whitespace-nowrap transition-all duration-300 border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-gold text-gold'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Demand' && (
            <div>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Keywords', value: niche.keywords.length },
                  { label: 'Avg Volume', value: niche.keywords.length ? Math.round(niche.keywords.reduce((s, k) => s + k.volume, 0) / niche.keywords.length).toLocaleString() : '0' },
                  { label: '% Growing', value: `${niche.keywords.length ? Math.round(niche.keywords.filter(k => k.trend_direction === 'growing' || k.trend_direction === 'exploding').length / niche.keywords.length * 100) : 0}%` },
                  { label: 'w/ Autocomplete', value: `${niche.keywords.filter(k => k.autocomplete_present).length}` },
                ].map(stat => (
                  <div key={stat.label} className="glass-card p-4">
                    <p className="text-xs text-text-muted">{stat.label}</p>
                    <p className="font-mono text-xl text-text-primary mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="bg-surface text-text-primary text-xs rounded-lg px-3 py-2 border border-border-subtle">
                  <option value="all">All Intents</option>
                  <option value="informational">Informational</option>
                  <option value="commercial">Commercial</option>
                  <option value="transactional">Transactional</option>
                  <option value="navigational">Navigational</option>
                </select>
                <select value={trendFilter} onChange={e => setTrendFilter(e.target.value)} className="bg-surface text-text-primary text-xs rounded-lg px-3 py-2 border border-border-subtle">
                  <option value="all">All Trends</option>
                  <option value="exploding">Exploding</option>
                  <option value="growing">Growing</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                </select>
              </div>

              {/* Keywords Table */}
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {[
                        { key: 'keyword', label: 'Keyword' },
                        { key: 'volume', label: 'Volume' },
                        { key: 'cpc', label: 'CPC' },
                        { key: 'intent', label: 'Intent' },
                        { key: 'trend_direction', label: 'Trend' },
                        { key: 'growth_pct_yoy', label: 'Growth' },
                        { key: 'autocomplete_present', label: 'AC' },
                        { key: 'trend_data', label: 'Sparkline' },
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key as keyof KeywordData)}
                          className="px-4 py-3 text-left text-xs font-body text-text-muted cursor-pointer hover:text-gold transition-colors"
                        >
                          {col.label} {sortKey === col.key ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKeywords.map(kw => (
                      <tr key={kw.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-body">{kw.keyword}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{kw.volume.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">${kw.cpc.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${intentBadgeColor[kw.intent] || 'bg-white/5 text-text-muted'}`}>
                            {kw.intent}
                          </span>
                        </td>
                        <td className="px-4 py-3"><TrendArrow direction={kw.trend_direction} /></td>
                        <td className="px-4 py-3"><TrendArrow direction={kw.trend_direction} growth={kw.growth_pct_yoy} /></td>
                        <td className="px-4 py-3">{kw.autocomplete_present ? <span className="text-emerald">{'\u2713'}</span> : <span className="text-text-muted/30">{'\u2013'}</span>}</td>
                        <td className="px-4 py-3"><Sparkline data={kw.trend_data} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedKeywords.length === 0 && (
                  <p className="p-6 text-center text-text-muted">No keywords found. Run a scan first.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Products' && (
            <div className="space-y-6">
              {/* Price vs Revenue Scatter */}
              {niche.products.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg text-text-primary mb-4">Price vs Revenue</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="price" name="Price" stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} label={{ value: 'Price ($)', position: 'insideBottom', offset: -5, fill: '#8b8a88' }} />
                      <YAxis dataKey="estimated_revenue" name="Revenue" stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#8b8a88' }} />
                      <Tooltip
                        contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e6e3', fontFamily: 'DM Sans' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        labelFormatter={(label) => `$${label}`}
                      />
                      {['gumroad', 'etsy', 'appstore'].map(platform => (
                        <Scatter
                          key={platform}
                          name={platform}
                          data={niche.products.filter(p => p.platform === platform)}
                          fill={PLATFORM_COLORS[platform]}
                          opacity={0.7}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Format Breakdown */}
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg text-text-primary mb-4">Format Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(formatBreakdown).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e6e3' }} />
                      <Bar dataKey="count" fill="#7c6cf0" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Platform Breakdown */}
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg text-text-primary mb-4">Platform Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={Object.entries(platformBreakdown).map(([k, v]) => ({ name: k, value: v }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        stroke="none"
                      >
                        {Object.keys(platformBreakdown).map((platform, i) => (
                          <Cell key={platform} fill={PLATFORM_COLORS[platform] || CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e6e3' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {Object.keys(platformBreakdown).map(p => (
                      <span key={p} className="flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p] || '#8b8a88' }} />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price Tiers */}
                <div className="glass-card p-5">
                  <h3 className="font-display text-lg text-text-primary mb-4">Price Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={['$0-10', '$10-25', '$25-50', '$50-100', '$100+'].map(t => ({ tier: t, count: priceTiers[t] || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="tier" stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} />
                      <YAxis stroke="#8b8a88" tick={{ fill: '#8b8a88', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e8e6e3' }} />
                      <Bar dataKey="count" fill="#d4a843" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Landscape */}
                {niche.ai_landscape && Object.keys(niche.ai_landscape).length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-display text-lg text-gold mb-4">AI Market Analysis</h3>
                    <div className="space-y-3 text-sm">
                      {niche.ai_landscape.market_summary && (
                        <p className="text-text-primary">{String(niche.ai_landscape.market_summary)}</p>
                      )}
                      {niche.ai_landscape.price_sweet_spot && (
                        <div><span className="text-text-muted">Price sweet spot:</span> <span className="font-mono text-emerald">{String(niche.ai_landscape.price_sweet_spot)}</span></div>
                      )}
                      {niche.ai_landscape.biggest_gap && (
                        <div><span className="text-text-muted">Biggest gap:</span> <span className="text-gold">{String(niche.ai_landscape.biggest_gap)}</span></div>
                      )}
                      {niche.ai_landscape.recommendation && (
                        <p className="text-text-primary italic border-l-2 border-gold/30 pl-3">{String(niche.ai_landscape.recommendation)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Leaderboard */}
              <div className="glass-card overflow-x-auto">
                <h3 className="font-display text-lg text-text-primary px-5 pt-5 pb-3">Revenue Leaderboard</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Platform</th>
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Rating</th>
                      <th className="px-4 py-2 text-left text-xs font-body text-text-muted">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niche.products.slice(0, 20).map(p => (
                      <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">{p.title}</a> : p.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${PLATFORM_COLORS[p.platform]}20`, color: PLATFORM_COLORS[p.platform] }}>
                            {p.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-text-muted">${p.price.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-emerald">${p.estimated_revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 font-mono text-text-muted">{p.rating > 0 ? p.rating.toFixed(1) : '-'}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">{p.product_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {niche.products.length === 0 && <p className="p-6 text-center text-text-muted">No products found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Pain Points' && (
            <div className="space-y-6">
              {/* Pain Point Cards */}
              <div>
                <h3 className="font-display text-xl text-text-primary mb-4">Pain Themes</h3>
                {niche.pain_points.filter(pp => pp.source !== 'ai_analysis').length > 0 ? (
                  <div className="space-y-3">
                    {niche.pain_points.filter(pp => pp.source !== 'ai_analysis').map((pp, i) => (
                      <PainPointCard key={pp.id} pp={pp} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center text-text-muted">No pain points yet.</div>
                )}
              </div>

              {/* Product Gaps */}
              {niche.pain_points.filter(pp => pp.source === 'ai_analysis').length > 0 && (
                <div>
                  <h3 className="font-display text-xl text-gold mb-4">Product Gaps (AI-Identified)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {niche.pain_points.filter(pp => pp.source === 'ai_analysis').map(pp => (
                      <div key={pp.id} className="glass-card p-4 border-l-2 border-gold/40">
                        <p className="text-sm text-text-primary">{pp.theme}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reddit Purchase Intent Feed */}
              <div>
                <h3 className="font-display text-xl text-text-primary mb-4">Purchase Intent Signals</h3>
                {niche.reddit_posts.filter(rp => rp.has_purchase_intent).length > 0 ? (
                  <div className="space-y-2">
                    {niche.reddit_posts.filter(rp => rp.has_purchase_intent).map(rp => (
                      <a
                        key={rp.id}
                        href={rp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card p-4 block hover:border-gold/30 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet/10 text-violet">r/{rp.subreddit}</span>
                          <span className="text-xs font-mono text-text-muted">{'\u25B2'} {rp.score}</span>
                          <span className="text-xs font-mono text-text-muted">{rp.comment_count} comments</span>
                        </div>
                        <p className="text-sm text-text-primary">{rp.title}</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center text-text-muted">No purchase intent signals detected.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Competitors' && (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="glass-card p-4">
                  <p className="text-xs text-text-muted">Keywords Analyzed</p>
                  <p className="font-mono text-xl text-text-primary mt-1">{niche.serp_results.length}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-text-muted">Avg Difficulty</p>
                  <p className="font-mono text-xl text-text-primary mt-1">
                    {niche.serp_results.length ? Math.round(niche.serp_results.reduce((s, sr) => s + sr.difficulty, 0) / niche.serp_results.length) : 0}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-text-muted">w/ AI Overview</p>
                  <p className="font-mono text-xl text-amber mt-1">
                    {niche.serp_results.filter(sr => sr.has_ai_overview).length}
                  </p>
                </div>
              </div>

              {/* SERP Table */}
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="px-4 py-3 text-left text-xs font-body text-text-muted">Keyword</th>
                      <th className="px-4 py-3 text-left text-xs font-body text-text-muted">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-body text-text-muted">AI Overview</th>
                      <th className="px-4 py-3 text-left text-xs font-body text-text-muted">Featured Snippet</th>
                      <th className="px-4 py-3 text-left text-xs font-body text-text-muted">Top Domains</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niche.serp_results.map(sr => (
                      <SerpRow key={sr.id} sr={sr} />
                    ))}
                  </tbody>
                </table>
                {niche.serp_results.length === 0 && <p className="p-6 text-center text-text-muted">No SERP data. Run a scan.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Opportunities' && (
            <div>
              {niche.opportunities.length > 0 ? (
                <div className="space-y-3">
                  {niche.opportunities.map((opp, i) => (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <OpportunityCard opp={opp} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-text-muted">No opportunities scored yet. Run a scan to analyze this niche.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PainPointCard({ pp, index }: { pp: { theme: string; intensity: number; frequency: number; example_quotes: string[] }; index: number }) {
  const [open, setOpen] = useState(false)
  const intensityColor = pp.intensity >= 4 ? 'bg-rose' : pp.intensity >= 3 ? 'bg-amber' : 'bg-emerald'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-body text-text-primary">{pp.theme}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">Intensity</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className={`w-3 h-1.5 rounded-full ${n <= pp.intensity ? intensityColor : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
            <span className="text-xs font-mono text-text-muted">{pp.frequency}x mentioned</span>
          </div>
        </div>
        <span className="text-text-muted text-xs">{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      <AnimatePresence>
        {open && pp.example_quotes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border-subtle space-y-2">
              {pp.example_quotes.map((q, i) => (
                <p key={i} className="text-xs text-text-muted italic pl-3 border-l border-white/10">"{q}"</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SerpRow({ sr }: { sr: { keyword: string; difficulty: number; has_ai_overview: boolean; has_featured_snippet: boolean; results: { domain: string }[] } }) {
  const [open, setOpen] = useState(false)
  const diffColor = sr.difficulty >= 70 ? 'bg-rose' : sr.difficulty >= 40 ? 'bg-amber' : 'bg-emerald'

  return (
    <>
      <tr className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setOpen(!open)}>
        <td className="px-4 py-3 font-body">{sr.keyword}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full ${diffColor} rounded-full`} style={{ width: `${sr.difficulty}%` }} />
            </div>
            <span className="font-mono text-xs text-text-muted">{sr.difficulty}</span>
          </div>
        </td>
        <td className="px-4 py-3">{sr.has_ai_overview ? <span className="text-amber text-xs">AI Overview</span> : <span className="text-text-muted/30 text-xs">No</span>}</td>
        <td className="px-4 py-3">{sr.has_featured_snippet ? <span className="text-emerald text-xs">{'\u2713'}</span> : <span className="text-text-muted/30">{'\u2013'}</span>}</td>
        <td className="px-4 py-3 text-xs text-text-muted">{sr.results.slice(0, 3).map(r => r.domain).join(', ')}</td>
      </tr>
      {open && sr.results.length > 0 && (
        <tr>
          <td colSpan={5} className="px-8 py-3 bg-white/[0.02]">
            <div className="space-y-1">
              {sr.results.slice(0, 5).map((r, i) => (
                <p key={i} className="text-xs text-text-muted">
                  <span className="font-mono text-gold/60">{i + 1}.</span> {r.domain}
                </p>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
