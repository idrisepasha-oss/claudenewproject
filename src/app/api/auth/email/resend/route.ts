import { NextRequest, NextResponse } from 'next/server'
import { generateOpaqueToken, hashToken } from '@/auth/tokens'
import { userRepository } from '@/auth/userRepository'
import { pool } from '@/lib/db'
import { requireAuth } from '@/middleware/requireAuth'

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const user = await userRepository.findById(auth.userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
  }

  const rawToken = generateOpaqueToken()
  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [auth.userId, hashToken(rawToken), new Date(Date.now() + VERIFY_TTL_MS)]
  )

  // TODO: await emailService.sendVerification(user.email, rawToken)

  return NextResponse.json({ message: 'Verification email sent' })
}
