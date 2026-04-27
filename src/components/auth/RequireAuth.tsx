'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface RequireAuthProps {
  children: ReactNode
  redirectTo?: string
}

export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo)
    }
  }, [isLoading, user, router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
