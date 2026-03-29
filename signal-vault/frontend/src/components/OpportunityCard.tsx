import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OpportunityData } from '../types'
import ScoreBadge from './ScoreBadge'
import ConfidenceBadge from './ConfidenceBadge'
import MiniScoreBar from './MiniScoreBar'

interface OpportunityCardProps {
  opp: OpportunityData
  showNiche?: boolean
}

const NICHE_NAMES: Record<string, string> = {
  'human-design': 'Human Design',
  'astrology': 'Astrology',
  'gene-keys': 'Gene Keys',
  'polyvagal': 'Polyvagal',
  'spiritual-wellness': 'Spiritual Wellness',
}

export default function OpportunityCard({ opp, showNiche }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false)

  let brief: Record<string, string> = {}
  if (opp.ai_brief) {
    try { brief = JSON.parse(opp.ai_brief) } catch { /* empty */ }
  }

  return (
    <motion.div
      layout
      className="glass-card p-5 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      whileHover={{ scale: 1.005 }}
    >
      <div className="flex items-start gap-4">
        <ScoreBadge score={opp.overall_score} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-semibold text-text-primary">{opp.keyword}</h3>
            {showNiche && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet/10 text-violet">
                {NICHE_NAMES[opp.niche_id] || opp.niche_id}
              </span>
            )}
            <ConfidenceBadge confidence={opp.confidence} />
          </div>
          <div className="flex gap-4 mt-2 text-xs font-mono text-text-muted">
            <span>{opp.volume.toLocaleString()} vol/mo</span>
            <span className={opp.growth > 0 ? 'text-emerald' : opp.growth < 0 ? 'text-rose' : ''}>
              {opp.growth > 0 ? '+' : ''}{opp.growth.toFixed(0)}% growth
            </span>
            <span>${opp.avg_price.toFixed(0)} avg price</span>
            <span>{opp.product_count} products</span>
          </div>

          <div className="mt-3 space-y-1.5">
            <MiniScoreBar label="Demand" value={opp.demand_score} />
            <MiniScoreBar label="WTP" value={opp.wtp_score} />
            <MiniScoreBar label="Gap" value={opp.gap_score} />
            <MiniScoreBar label="Feasibility" value={opp.feasibility_score} />
            <MiniScoreBar label="Timing" value={opp.timing_score} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && brief.summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border-subtle space-y-3 text-sm">
              {brief.what_to_build && (
                <div><span className="text-gold font-semibold">What to Build:</span> <span className="text-text-primary">{brief.what_to_build}</span></div>
              )}
              {brief.why_it_works && (
                <div><span className="text-gold font-semibold">Why It Works:</span> <span className="text-text-primary">{brief.why_it_works}</span></div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {brief.price && (
                  <div><span className="text-text-muted text-xs">Price</span><p className="font-mono text-emerald">{brief.price}</p></div>
                )}
                {brief.format && (
                  <div><span className="text-text-muted text-xs">Format</span><p className="text-text-primary">{brief.format}</p></div>
                )}
                {brief.build_time && (
                  <div><span className="text-text-muted text-xs">Build Time</span><p className="text-text-primary">{brief.build_time}</p></div>
                )}
                {brief.launch_channel && (
                  <div><span className="text-text-muted text-xs">Channel</span><p className="text-text-primary">{brief.launch_channel}</p></div>
                )}
              </div>
              {brief.risk && (
                <div><span className="text-rose font-semibold">Risk:</span> <span className="text-text-muted">{brief.risk}</span></div>
              )}
              {brief.summary && (
                <p className="text-text-primary italic border-l-2 border-gold/30 pl-3">{brief.summary}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
