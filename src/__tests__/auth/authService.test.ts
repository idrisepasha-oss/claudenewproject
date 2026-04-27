import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService, AuthError } from '@/auth/authService'

const {
  mockFindByEmail, mockCreate, mockUpdateLastLogin,
  mockCreateToken, mockFindByTokenHash, mockRevokeFamily, mockRotate,
} = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdateLastLogin: vi.fn(),
  mockCreateToken: vi.fn(),
  mockFindByTokenHash: vi.fn(),
  mockRevokeFamily: vi.fn(),
  mockRotate: vi.fn(),
}))

vi.mock('@/auth/userRepository', () => ({
  userRepository: {
    findByEmail: mockFindByEmail,
    create: mockCreate,
    updateLastLogin: mockUpdateLastLogin,
  },
}))

vi.mock('@/auth/refreshTokenRepository', () => ({
  refreshTokenRepository: {
    create: mockCreateToken,
    findByTokenHash: mockFindByTokenHash,
    revokeFamily: mockRevokeFamily,
    rotate: mockRotate,
  },
}))

vi.mock('@/lib/db', () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [{ password_hash: '' }] }) },
}))

vi.mock('@/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$hashed'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

const fakeUser = {
  id: 'user-uuid-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('authService.register', () => {
  it('creates a user when email is not taken', async () => {
    mockFindByEmail.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce(fakeUser)
    const user = await authService.register('alice@example.com', 'password123')
    expect(user.email).toBe('alice@example.com')
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('throws EMAIL_TAKEN when email already exists', async () => {
    mockFindByEmail.mockResolvedValueOnce(fakeUser)
    await expect(authService.register('alice@example.com', 'password123'))
      .rejects.toMatchObject({ code: 'EMAIL_TAKEN' })
  })
})

describe('authService.login', () => {
  it('throws INVALID_CREDENTIALS for unknown email', async () => {
    mockFindByEmail.mockResolvedValueOnce(null)
    await expect(authService.login('nobody@example.com', 'password123'))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('returns tokens on valid credentials', async () => {
    mockFindByEmail.mockResolvedValueOnce(fakeUser)
    mockUpdateLastLogin.mockResolvedValueOnce(undefined)
    mockCreateToken.mockResolvedValueOnce({})
    const result = await authService.login('alice@example.com', 'password123')
    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')
    expect(result.user.id).toBe('user-uuid-1')
  })
})

describe('authService.refresh', () => {
  const validToken = {
    id: 'rt-1',
    userId: 'user-uuid-1',
    tokenHash: 'hash',
    familyId: 'fam-1',
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    replacedById: null,
    createdAt: new Date(),
  }

  it('throws INVALID_TOKEN when token not found', async () => {
    mockFindByTokenHash.mockResolvedValueOnce(null)
    await expect(authService.refresh('bad-token'))
      .rejects.toMatchObject({ code: 'INVALID_TOKEN' })
  })

  it('revokes family and throws TOKEN_REUSE on reuse', async () => {
    mockFindByTokenHash.mockResolvedValueOnce({ ...validToken, revokedAt: new Date() })
    mockRevokeFamily.mockResolvedValueOnce(undefined)
    await expect(authService.refresh('reused-token'))
      .rejects.toMatchObject({ code: 'TOKEN_REUSE' })
    expect(mockRevokeFamily).toHaveBeenCalledWith('fam-1')
  })

  it('throws TOKEN_EXPIRED for expired token', async () => {
    mockFindByTokenHash.mockResolvedValueOnce({ ...validToken, expiresAt: new Date(0) })
    await expect(authService.refresh('expired-token'))
      .rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
  })

  it('rotates token and returns new pair', async () => {
    mockFindByTokenHash.mockResolvedValueOnce(validToken)
    mockRotate.mockResolvedValueOnce({})
    const result = await authService.refresh('valid-token')
    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')
    expect(mockRotate).toHaveBeenCalledOnce()
  })
})

describe('authService.logout', () => {
  it('revokes family when token exists', async () => {
    mockFindByTokenHash.mockResolvedValueOnce({ familyId: 'fam-1' })
    mockRevokeFamily.mockResolvedValueOnce(undefined)
    await authService.logout('some-token')
    expect(mockRevokeFamily).toHaveBeenCalledWith('fam-1')
  })

  it('is a no-op when token not found', async () => {
    mockFindByTokenHash.mockResolvedValueOnce(null)
    await expect(authService.logout('unknown-token')).resolves.toBeUndefined()
    expect(mockRevokeFamily).not.toHaveBeenCalled()
  })
})
