import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { NicheSummary, OpportunityData } from '../types'
import { useApiGet, apiFetch } from '../hooks/useApi'
import { SkeletonCard } from '../components/Skeleton'
import TrendArrow from '../components/TrendArrow'
import OpportunityCard from '../components/OpportunityCard'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

export default function Dashboard() {
  const { data: niches, loading: nichesLoading, error: nichesError, refetch: refetchNiches } = useApiGet<NicheSummary[]>('/niches')
  const { data: opportunities, loading: oppsLoading, error: oppsError, refetch: refetchOpps } = useApiGet<OpportunityData[]>('/opportunities')
  const [scanError, setScanError] = useState<string | null>(null)

  const handleScan = async (nicheId: string) => {
    try {
      setScanError(null)
      await apiFetch(`/scan/${nicheId}`, { method: 'POST' })
      setTimeout(() => { refetchNiches(); refetchOpps() }, 2000)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed')
    }
  }

  const handleScanAll = async () => {
    try {
      setScanError(null)
      await apiFetch('/scan/all', { method: 'POST' })
      setTimeout(() => { refetchNiches(); refetchOpps() }, 5000)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Scan failed')
    }
  }

  const totalKeywords = niches?.reduce((s, n) => s + n.keyword_count, 0) || 0
  const totalOpps = niches?.reduce((s, n) => s + n.opportunity_count, 0) || 0
  const growingCount = niches?.filter(n => n.trend === 'growing').length || 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-display text-4xl lg:text-5xl font-bold text-gradient-gold tracking-wide"
          >
            Signal Vault
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-text-muted mt-2 font-body text-sm"
          >
            Personal Market Intelligence Dashboard
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleScanAll}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold/15 to-gold/5 text-gold font-body text-sm font-medium border border-gold/15 hover:border-gold/30 transition-all duration-300 hover:shadow-[0_4px_24px_rgba(212,168,67,0.15)] active:scale-[0.97]"
        >
          Scan All Niches
        </motion.button>
      </div>

      {/* Error display */}
      {(nichesError || oppsError || scanError) && (
        <div className="error-banner mb-6">
          {nichesError && <p>Failed to load niches: {nichesError}</p>}
          {oppsError && <p>Failed to load opportunities: {oppsError}</p>}
          {scanError && <p>Scan error: {scanError}</p>}
        </div>
      )}

      {/* Stats Bar */}
      {!nichesLoading && niches && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: 'Keywords Tracked', value: totalKeywords.toLocaleString(), accent: 'text-violet' },
            { label: 'Opportunities', value: totalOpps.toString(), accent: 'text-gold' },
            { label: 'Niches Growing', value: `${growingCount} / ${niches.length}`, accent: 'text-emerald' },
          ].map(stat => (
            <div key={stat.label} className="glass-card px-5 py-4">
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">{stat.label}</p>
              <p className={`font-mono text-2xl font-medium mt-1 ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Niche Cards — Bento Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12"
      >
        {nichesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          niches?.map((niche) => (
            <motion.div key={niche.id} variants={item}>
              <div className={`glass-card-interactive p-6 ${niche.scan_status === 'running' ? 'scanning' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <Link to={`/niche/${niche.id}`} className="flex-1 group">
                    <h3 className="font-display text-xl font-semibold text-text-primary group-hover:text-gold transition-colors duration-300">
                      {niche.name}
                    </h3>
                  </Link>
                  <TrendArrow direction={niche.trend} />
                </div>

                <div className="flex gap-5 mb-5">
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Keywords</p>
                    <p className="font-mono text-lg text-text-primary mt-0.5">{niche.keyword_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Opportunities</p>
                    <p className="font-mono text-lg text-gold mt-0.5">{niche.opportunity_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                  <span className="text-[11px] text-text-muted font-mono">
                    {niche.last_scanned
                      ? `${new Date(niche.last_scanned).toLocaleDateString()}`
                      : 'Never scanned'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleScan(niche.id) }}
                    disabled={niche.scan_status === 'running'}
                    className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-xs font-body text-text-muted border border-white/[0.06] hover:text-gold hover:border-gold/20 hover:bg-gold/[0.06] transition-all duration-300 disabled:opacity-40 active:scale-[0.96]"
                  >
                    {niche.scan_status === 'running' ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Top Opportunities */}
      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold text-text-primary">Top Opportunities</h2>
          {opportunities && opportunities.length > 5 && (
            <Link to="/opportunities" className="text-xs font-body text-text-muted hover:text-gold transition-colors">
              View all {'\u2192'}
            </Link>
          )}
        </div>
        {oppsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : opportunities && opportunities.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {opportunities.slice(0, 5).map((opp) => (
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
            <p className="text-text-muted font-body text-sm">No opportunities yet. Run a scan to discover them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
