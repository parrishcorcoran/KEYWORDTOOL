import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useApi'

export default function Login() {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    try {
      await login(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet/[0.06] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 mb-5 shadow-[0_0_40px_rgba(212,168,67,0.15)]"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L6 9v7c0 6.075 4.477 11.456 10 13 5.523-1.544 10-6.925 10-13V9L16 4z" stroke="#d4a843" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="15" r="3" stroke="#d4a843" strokeWidth="1.5"/>
              <path d="M16 18v4" stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.div>
          <h1 className="font-display text-3xl font-semibold text-text-primary tracking-wide">Signal Vault</h1>
          <p className="text-text-muted text-sm mt-2 font-body">Enter your password to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text-primary font-body text-sm placeholder:text-text-muted/50 outline-none transition-all duration-300 focus:border-gold/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(212,168,67,0.08)]"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold/0 via-gold/[0.05] to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose text-xs font-body px-1"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 rounded-xl font-body text-sm font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-gold/90 to-gold/70 text-deep hover:from-gold hover:to-gold/80 hover:shadow-[0_4px_24px_rgba(212,168,67,0.3)] active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Authenticating...
              </span>
            ) : 'Unlock Vault'}
          </button>
        </form>

        <p className="text-center text-text-muted/40 text-xs mt-8 font-mono">v1.0 — Personal Intelligence</p>
      </motion.div>
    </div>
  )
}
