import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Auth Context ──────────────────────────────────────────────────────────

interface AuthState {
  token: string | null
  login: (password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState>({
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('sv_token'))

  const login = async (password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(err.detail || 'Invalid password')
    }
    const data = await res.json()
    setToken(data.token)
    sessionStorage.setItem('sv_token', data.token)
  }

  const logout = () => {
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    setToken(null)
    sessionStorage.removeItem('sv_token')
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── API Fetch ─────────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('sv_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    sessionStorage.removeItem('sv_token')
    window.location.reload()
    throw new Error('Session expired')
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function useApiGet<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    apiFetch<T>(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
