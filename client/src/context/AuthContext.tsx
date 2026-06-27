import {
  createContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { apiPost, apiGet, apiClient } from '@/api/client'

export interface AuthUser {
  id:      string
  email:   string
  name:    string
  role:    string
  orgId:   string
  orgName: string
}

export interface AuthContextValue {
  user:     AuthUser | null
  token:    string | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout:   () => void
  isAuthed: boolean
}

interface RegisterData {
  email:    string
  password: string
  name:     string
  orgName:  string
  orgSlug:  string
}

const TOKEN_KEY = 'ct_token'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  // Bootstrap — verify stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { setLoading(false); return }

    apiGet<{ id: string; email: string; name: string; role: string; organizations: { id: string; name: string; role: string }[] }>('/auth/me')
      .then(me => {
        const org = me.organizations[0]
        if (!org) throw new Error('No organization')
        setUser({ id: me.id, email: me.email, name: me.name, role: me.role, orgId: org.id, orgName: org.name })
        setToken(stored)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, res.token)
    apiClient.defaults.headers.common.Authorization = `Bearer ${res.token}`
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const res = await apiPost<{ token: string; user: AuthUser }>('/auth/register', data)
    localStorage.setItem(TOKEN_KEY, res.token)
    apiClient.defaults.headers.common.Authorization = `Bearer ${res.token}`
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    delete apiClient.defaults.headers.common.Authorization
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthed: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}
