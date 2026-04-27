import { randomUUID } from 'crypto'
import { userRepository } from '@/auth/userRepository'
import { refreshTokenRepository } from '@/auth/refreshTokenRepository'
import { hashPassword, verifyPassword } from '@/auth/password'
import { signAccessToken, generateOpaqueToken, hashToken } from '@/auth/tokens'
import type { User } from '@/auth/types'

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000
const ACCESS_TTL = '15m'

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

export const authService = {
  async register(email: string, password: string, displayName?: string): Promise<User> {
    const existing = await userRepository.findByEmail(email)
    if (existing) throw new AuthError('EMAIL_TAKEN', 'Email already registered')
    const passwordHash = await hashPassword(password)
    return userRepository.create({ email, passwordHash, displayName })
  },

  async login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await userRepository.findByEmail(email)
    if (!user) throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password')

    const passwordHash = await _getPasswordHash(email)
    const valid = await verifyPassword(password, passwordHash)
    if (!valid) throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password')

    await userRepository.updateLastLogin(user.id)

    const accessToken = await signAccessToken({ sub: user.id }, ACCESS_TTL)
    const rawRefresh = generateOpaqueToken()
    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(rawRefresh),
      familyId: randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    })

    return { accessToken, refreshToken: rawRefresh, user }
  },

  async refresh(
    rawToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const stored = await refreshTokenRepository.findByTokenHash(hashToken(rawToken))
    if (!stored) throw new AuthError('INVALID_TOKEN', 'Refresh token not found')

    if (stored.revokedAt) {
      await refreshTokenRepository.revokeFamily(stored.familyId)
      throw new AuthError('TOKEN_REUSE', 'Refresh token reuse detected — all sessions revoked')
    }
    if (stored.expiresAt < new Date()) {
      throw new AuthError('TOKEN_EXPIRED', 'Refresh token expired')
    }

    const newRaw = generateOpaqueToken()
    await refreshTokenRepository.rotate(
      stored.id,
      hashToken(newRaw),
      stored.familyId,
      new Date(Date.now() + REFRESH_TTL_MS)
    )

    const accessToken = await signAccessToken({ sub: stored.userId }, ACCESS_TTL)
    return { accessToken, refreshToken: newRaw }
  },

  async logout(rawToken: string): Promise<void> {
    const stored = await refreshTokenRepository.findByTokenHash(hashToken(rawToken))
    if (stored) await refreshTokenRepository.revokeFamily(stored.familyId)
  },
}

async function _getPasswordHash(email: string): Promise<string> {
  const { pool } = await import('@/lib/db')
  const { rows } = await pool.query(
    'SELECT password_hash FROM users WHERE email_lower = $1',
    [email.toLowerCase()]
  )
  return rows[0]?.password_hash ?? ''
}
