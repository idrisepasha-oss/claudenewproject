'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: displayName || undefined }),
      })
      if (res.status === 400) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Registration failed')
      }
      if (res.status === 201) {
        await login(email, password)
        router.replace('/')
        return
      }
      setShowConfirm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsPending(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white px-8 py-10 shadow-2xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl">
            ✉
          </div>
          <h1 className="mb-2 text-xl font-semibold text-neutral-900">Check your inbox</h1>
          <p className="text-sm text-neutral-500">
            If this email isn&apos;t already registered, you&apos;ll receive a confirmation shortly.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/login" className="font-medium text-white transition-colors hover:text-neutral-300">
            ← Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-white px-8 py-10 shadow-2xl">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">
          Create account
        </h1>
        <p className="mb-8 text-sm text-neutral-500">Get started in seconds</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Name <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Password <span className="text-neutral-400">(min. 8 chars)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-60"
          >
            {isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-white transition-colors hover:text-neutral-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
