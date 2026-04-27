import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { userRepository } from '@/auth/userRepository'
import { generateOpaqueToken, hashToken } from '@/auth/tokens'
import { pool } from '@/lib/db'

const schema = z.object({ email: z.string().email() })
const RESET_TTL_MS = 60 * 60 * 1000

const GENERIC = NextResponse.json(
  { message: 'If that email is registered, a reset link has been sent.' },
  { status: 200 }
)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return GENERIC

  const user = await userRepository.findByEmail(parsed.data.email)
  if (!user) return GENERIC

  const rawToken = generateOpaqueToken()
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, hashToken(rawToken), new Date(Date.now() + RESET_TTL_MS)]
  )

  // TODO: await emailService.sendPasswordReset(user.email, rawToken)

  return GENERIC
}
