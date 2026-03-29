import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { NicheSummary, OpportunityData } from '../types'
import { useApiGet, apiFetch } from '../hooks/useApi'
import { SkeletonCard } from '../components/Skeleton'
import TrendArrow from '../components/TrendArrow'
import OpportunityCard from '../components/OpportunityCard'

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-gold tracking-wide">Signal Vault</h1>
          <p className="text-text-muted mt-1 font-body">Personal Market Intelligence</p>
        </div>
        <button
          onClick={handleScanAll}
          className="px-5 py-2.5 rounded-lg bg-gold/10 text-gold font-body text-sm font-medium hover:bg-gold/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,67,0.2)]"
        >
          Scan All Niches
        </button>
      </div>

      {/* Error displays */}
      {(nichesError || oppsError || scanError) && (
        <div className="mb-4 glass-card p-4 border border-rose/30 text-rose text-sm">
          {nichesError && <p>Failed to load niches: {nichesError}</p>}
          {oppsError && <p>Failed to load opportunities: {oppsError}</p>}
          {scanError && <p>Scan error: {scanError}</p>}
        </div>
      )}

      {/* Niche Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {nichesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          niches?.map((niche, i) => (
            <motion.div
              key={niche.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`glass-card p-5 ${niche.scan_status === 'running' ? 'scanning' : ''}`}>
                <div className="flex items-start justify-between">
                  <Link to={`/niche/${niche.id}`} className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-text-primary hover:text-gold transition-colors">
                      {niche.name}
                    </h3>
                  </Link>
                  <TrendArrow direction={niche.trend} />
                </div>

                <div className="flex gap-4 mt-3 text-xs font-mono text-text-muted">
                  <span>{niche.keyword_count} keywords</span>
                  <span>{niche.opportunity_count} opportunities</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-text-muted">
                    {niche.last_scanned
                      ? `Scanned ${new Date(niche.last_scanned).toLocaleDateString()}`
                      : 'Never scanned'}
                  </span>
                  <button
                    onClick={() => handleScan(niche.id)}
                    disabled={niche.scan_status === 'running'}
                    className="px-3 py-1.5 rounded-md bg-white/[0.06] text-xs font-body text-text-muted hover:text-gold hover:bg-gold/10 transition-all duration-300 disabled:opacity-50"
                  >
                    {niche.scan_status === 'running' ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Top Opportunities */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-text-primary mb-4">Top Opportunities</h2>
        {oppsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : opportunities && opportunities.length > 0 ? (
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp, i) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <OpportunityCard opp={opp} showNiche />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-text-muted font-body">No opportunities yet. Run a scan to discover them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
