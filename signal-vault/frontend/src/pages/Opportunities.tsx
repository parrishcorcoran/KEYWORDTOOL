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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

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
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-text-primary">All Opportunities</h1>
          <p className="text-text-muted text-sm mt-2 font-body">Cross-niche opportunity rankings</p>
        </div>
        <span className="font-mono text-sm text-text-muted">{filtered.length} results</span>
      </div>

      {error && <div className="error-banner mb-6">Failed to load opportunities: {error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={nicheFilter}
          onChange={e => setNicheFilter(e.target.value)}
          className="bg-white/[0.04] text-text-primary text-sm rounded-xl px-4 py-2.5 border border-white/[0.08] focus:border-gold/30 focus:outline-none transition-colors"
        >
          {NICHE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-2 border border-white/[0.08]">
          <label className="text-xs text-text-muted font-mono">Min Score</label>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-28 accent-gold"
          />
          <span className="font-mono text-sm text-gold w-8 text-right">{minScore}</span>
        </div>
      </div>

      {/* Opportunity List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((opp) => (
            <motion.div key={opp.id} variants={item}>
              <OpportunityCard opp={opp} showNiche />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="glass-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gold/[0.08] border border-gold/[0.1] mx-auto mb-4 flex items-center justify-center">
            <span className="text-gold text-xl">{'\u2726'}</span>
          </div>
          <p className="text-text-muted font-body text-sm">No opportunities found. Adjust filters or run scans first.</p>
        </div>
      )}
    </div>
  )
}
