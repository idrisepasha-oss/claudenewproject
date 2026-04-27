import { describe, it, expect } from 'vitest'
import {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashToken,
} from '@/auth/tokens'

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips a valid payload', async () => {
    const payload = { sub: 'user-123', role: 'user' }
    const token = await signAccessToken(payload, '15m')
    const decoded = await verifyAccessToken(token)
    expect(decoded.sub).toBe('user-123')
    expect(decoded.role).toBe('user')
  })

  it('rejects a token signed with a different secret', async () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalid'
    await expect(verifyAccessToken(token)).rejects.toThrow()
  })

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not.a.jwt')).rejects.toThrow()
  })

  it('rejects an expired token', async () => {
    // Pass a unix timestamp 60s in the past to create an already-expired token
    const pastTimestamp = Math.floor(Date.now() / 1000) - 60
    const token = await signAccessToken({ sub: 'user-123' }, pastTimestamp)
    await expect(verifyAccessToken(token)).rejects.toThrow()
  })

  it('includes jti claim', async () => {
    const token = await signAccessToken({ sub: 'user-123' }, '15m')
    const decoded = await verifyAccessToken(token)
    expect(typeof decoded.jti).toBe('string')
    expect(decoded.jti!.length).toBeGreaterThan(0)
  })
})

describe('generateOpaqueToken', () => {
  it('returns a non-empty string', () => {
    expect(generateOpaqueToken().length).toBeGreaterThan(0)
  })

  it('produces unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateOpaqueToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('hashToken', () => {
  it('returns a deterministic SHA-256 hex string', () => {
    const token = 'test-token-value'
    expect(hashToken(token)).toBe(hashToken(token))
    expect(hashToken(token)).toHaveLength(64)
  })

  it('produces different hashes for different tokens', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
  })
})
