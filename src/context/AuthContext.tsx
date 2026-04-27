'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { setAccessToken, apiFetch } from '@/lib/apiClient'

interface AuthUser {
  id: string
  email: string
  displayName: string | null
  emailVerifiedAt: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  register(email: string, password: string, displayName?: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async res => {
        if (!res.ok || cancelled) return
        const { accessToken } = (await res.json()) as { accessToken: string }
        setAccessToken(accessToken)
        const meRes = await apiFetch('/api/auth/me')
        if (!meRes.ok || cancelled) return
        const me = (await meRes.json()) as AuthUser
        setUser(me)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    const data = (await res.json()) as {
      accessToken?: string
      user?: AuthUser
      error?: string
    }
    if (!res.ok) throw new Error(data.error ?? 'Login failed')
    setAccessToken(data.accessToken!)
    setUser(data.user!)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      if (res.status === 400) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Registration failed')
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
