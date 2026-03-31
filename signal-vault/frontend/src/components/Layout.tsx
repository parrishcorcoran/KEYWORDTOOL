import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useApi'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '\u25C8' },
  { path: '/opportunities', label: 'Opportunities', icon: '\u2726' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Ambient background glows */}
      <div className="ambient-glow w-[600px] h-[600px] bg-gold/[0.03] top-[-10%] left-[-5%]" />
      <div className="ambient-glow w-[500px] h-[500px] bg-violet/[0.04] bottom-[-10%] right-[-5%]" />

      {/* Sidebar */}
      <nav className="lg:w-60 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-deep/60 backdrop-blur-2xl flex lg:flex-col shrink-0 z-10 relative">
        <Link to="/" className="p-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/15 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,67,0.1)]">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L6 9v7c0 6.075 4.477 11.456 10 13 5.523-1.544 10-6.925 10-13V9L16 4z" stroke="#d4a843" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="15" r="3" stroke="#d4a843" strokeWidth="2"/>
              <path d="M16 18v4" stroke="#d4a843" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-gradient-gold tracking-wide leading-tight">
              Signal Vault
            </h1>
            <p className="text-[10px] font-mono text-text-muted/50 tracking-widest uppercase">Intelligence</p>
          </div>
        </Link>

        <div className="flex lg:flex-col gap-0.5 px-3 lg:mt-3 overflow-x-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 whitespace-nowrap group ${
                  active
                    ? 'text-gold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-gold/[0.08] border border-gold/[0.12]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative text-base">{item.icon}</span>
                <span className="relative font-body font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="hidden lg:flex flex-col mt-auto p-4 gap-3 border-t border-white/[0.05]">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body text-text-muted hover:text-rose hover:bg-rose/[0.06] transition-all duration-300"
          >
            <span className="text-sm">{'\u2190'}</span>
            Lock Vault
          </button>
          <p className="text-[10px] text-text-muted/30 font-mono px-1">v1.0</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 lg:p-8 xl:p-10 max-w-[1400px] mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
