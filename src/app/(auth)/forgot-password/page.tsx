'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } finally {
      setIsPending(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white px-8 py-10 shadow-2xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl">
            ✉
          </div>
          <h1 className="mb-2 text-xl font-semibold text-neutral-900">Check your email</h1>
          <p className="text-sm text-neutral-500">
            If that address is registered, you&apos;ll receive a reset link shortly.
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
          Reset password
        </h1>
        <p className="mb-8 text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-60"
          >
            {isPending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-white transition-colors hover:text-neutral-300">
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
