'use client'

import { useState, type FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Reset failed')
      }
      router.replace('/login?reset=success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsPending(false)
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white px-8 py-10 shadow-2xl text-center">
        <p className="text-sm text-neutral-500">Invalid or missing reset token.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white px-8 py-10 shadow-2xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">New password</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Choose a strong password (min. 8 characters).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
            New password
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
          {isPending ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-white transition-colors hover:text-neutral-300">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
