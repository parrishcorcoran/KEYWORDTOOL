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
      className="glass-card-interactive p-5 lg:p-6"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4 lg:gap-5">
        <ScoreBadge score={opp.overall_score} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg font-semibold text-text-primary">{opp.keyword}</h3>
            {showNiche && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet/[0.08] text-violet/80 border border-violet/[0.1]">
                {NICHE_NAMES[opp.niche_id] || opp.niche_id}
              </span>
            )}
            <ConfidenceBadge confidence={opp.confidence} />
          </div>

          <div className="flex gap-4 mt-2.5 text-xs font-mono text-text-muted">
            <span>{opp.volume.toLocaleString()} vol/mo</span>
            <span className={opp.growth > 0 ? 'text-emerald' : opp.growth < 0 ? 'text-rose' : ''}>
              {opp.growth > 0 ? '+' : ''}{opp.growth.toFixed(0)}%
            </span>
            <span>${opp.avg_price.toFixed(0)} avg</span>
            <span className="hidden sm:inline">{opp.product_count} products</span>
          </div>

          <div className="mt-4 space-y-1.5">
            <MiniScoreBar label="Demand" value={opp.demand_score} />
            <MiniScoreBar label="WTP" value={opp.wtp_score} />
            <MiniScoreBar label="Gap" value={opp.gap_score} />
            <MiniScoreBar label="Feasibility" value={opp.feasibility_score} />
            <MiniScoreBar label="Timing" value={opp.timing_score} />
          </div>
        </div>

        <span className="text-text-muted/40 text-xs mt-1 transition-transform duration-300" style={{ transform: expanded ? 'rotate(180deg)' : '' }}>
          {'\u25BC'}
        </span>
      </div>

      <AnimatePresence>
        {expanded && brief.summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-4 text-sm">
              {brief.what_to_build && (
                <div><span className="text-gold font-semibold text-xs uppercase tracking-wider">Build</span><p className="text-text-primary mt-1">{brief.what_to_build}</p></div>
              )}
              {brief.why_it_works && (
                <div><span className="text-gold font-semibold text-xs uppercase tracking-wider">Why</span><p className="text-text-primary mt-1">{brief.why_it_works}</p></div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {brief.price && (
                  <div className="glass-card p-3 rounded-xl"><span className="text-text-muted text-[10px] uppercase tracking-wider">Price</span><p className="font-mono text-emerald mt-1">{brief.price}</p></div>
                )}
                {brief.format && (
                  <div className="glass-card p-3 rounded-xl"><span className="text-text-muted text-[10px] uppercase tracking-wider">Format</span><p className="text-text-primary mt-1 text-sm">{brief.format}</p></div>
                )}
                {brief.build_time && (
                  <div className="glass-card p-3 rounded-xl"><span className="text-text-muted text-[10px] uppercase tracking-wider">Build</span><p className="text-text-primary mt-1 text-sm">{brief.build_time}</p></div>
                )}
                {brief.launch_channel && (
                  <div className="glass-card p-3 rounded-xl"><span className="text-text-muted text-[10px] uppercase tracking-wider">Channel</span><p className="text-text-primary mt-1 text-sm">{brief.launch_channel}</p></div>
                )}
              </div>
              {brief.risk && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-rose/[0.04] border border-rose/[0.1]">
                  <span className="text-rose text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5">Risk</span>
                  <span className="text-text-muted text-sm">{brief.risk}</span>
                </div>
              )}
              {brief.summary && (
                <p className="text-text-secondary italic border-l-2 border-gold/20 pl-4 text-sm leading-relaxed">{brief.summary}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
