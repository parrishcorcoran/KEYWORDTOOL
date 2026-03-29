import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '\u25C8' },
  { path: '/opportunities', label: 'Opportunities', icon: '\u2726' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <nav className="lg:w-56 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-border-subtle bg-deep/80 backdrop-blur-xl flex lg:flex-col shrink-0">
        <Link to="/" className="p-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
            <span className="text-gold text-sm">{'\u25C8'}</span>
          </div>
          <h1 className="font-display text-xl font-semibold text-gold tracking-wide">
            Signal Vault
          </h1>
        </Link>

        <div className="flex lg:flex-col gap-1 px-3 lg:mt-4 overflow-x-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 whitespace-nowrap ${
                  active
                    ? 'bg-gold/10 text-gold'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-body">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="hidden lg:block mt-auto p-4 border-t border-border-subtle">
          <p className="text-xs text-text-muted font-mono">Signal Vault v1.0</p>
          <p className="text-xs text-text-muted/50 font-mono mt-1">Personal Intelligence</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
