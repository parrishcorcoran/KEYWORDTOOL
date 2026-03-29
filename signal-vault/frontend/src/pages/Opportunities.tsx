import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { OpportunityData } from '../types'
import { useApiGet } from '../hooks/useApi'
import { SkeletonCard } from '../components/Skeleton'
import OpportunityCard from '../components/OpportunityCard'

const NICHE_OPTIONS = [
  { value: 'all', label: 'All Niches' },
  { value: 'human-design', label: 'Human Design' },
  { value: 'astrology', label: 'Astrology' },
  { value: 'gene-keys', label: 'Gene Keys' },
  { value: 'polyvagal', label: 'Polyvagal' },
  { value: 'spiritual-wellness', label: 'Spiritual Wellness' },
]

export default function Opportunities() {
  const { data: opportunities, loading, error } = useApiGet<OpportunityData[]>('/opportunities')
  const [nicheFilter, setNicheFilter] = useState('all')
  const [minScore, setMinScore] = useState(0)

  const filtered = useMemo(() => {
    if (!opportunities) return []
    return opportunities
      .filter(o => nicheFilter === 'all' || o.niche_id === nicheFilter)
      .filter(o => o.overall_score >= minScore)
  }, [opportunities, nicheFilter, minScore])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">All Opportunities</h1>
          <p className="text-text-muted text-sm mt-1">Cross-niche opportunity rankings</p>
        </div>
        <span className="font-mono text-sm text-text-muted">{filtered.length} results</span>
      </div>

      {error && (
        <div className="mb-4 glass-card p-4 border border-rose/30 text-rose text-sm">Failed to load opportunities: {error}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={nicheFilter}
          onChange={e => setNicheFilter(e.target.value)}
          className="bg-surface text-text-primary text-sm rounded-lg px-3 py-2 border border-border-subtle"
        >
          {NICHE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Min Score:</label>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-24 accent-gold"
          />
          <span className="font-mono text-xs text-gold w-6">{minScore}</span>
        </div>
      </div>

      {/* Opportunity List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((opp, i) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <OpportunityCard opp={opp} showNiche />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-text-muted">No opportunities found. Adjust filters or run scans first.</p>
        </div>
      )}
    </div>
  )
}
