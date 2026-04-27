import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userRepository } from '@/auth/userRepository'

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }))

vi.mock('@/lib/db', () => ({
  pool: { query: mockQuery },
}))

const fakeRow = {
  id: 'uuid-001',
  email: 'user@example.com',
  email_lower: 'user@example.com',
  display_name: 'Test User',
  email_verified_at: null,
  last_login_at: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
}

beforeEach(() => vi.clearAllMocks())

describe('userRepository.findByEmail', () => {
  it('returns a user when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 })
    const user = await userRepository.findByEmail('user@example.com')
    expect(user).not.toBeNull()
    expect(user!.email).toBe('user@example.com')
    expect(user!.id).toBe('uuid-001')
  })

  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const user = await userRepository.findByEmail('nobody@example.com')
    expect(user).toBeNull()
  })

  it('queries by lowercased email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    await userRepository.findByEmail('UPPER@Example.com')
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ['upper@example.com']
    )
  })
})

describe('userRepository.findById', () => {
  it('returns a user when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 })
    const user = await userRepository.findById('uuid-001')
    expect(user!.id).toBe('uuid-001')
  })

  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    expect(await userRepository.findById('no-such-id')).toBeNull()
  })
})

describe('userRepository.create', () => {
  it('inserts and returns the new user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow], rowCount: 1 })
    const user = await userRepository.create({
      email: 'user@example.com',
      passwordHash: '$argon2id$v=19$...',
      displayName: 'Test User',
    })
    expect(user.email).toBe('user@example.com')
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toMatch(/INSERT INTO users/i)
    expect(params).toContain('user@example.com')
  })
})

describe('userRepository.markEmailVerified', () => {
  it('issues an UPDATE with the correct id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 })
    await userRepository.markEmailVerified('uuid-001')
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toMatch(/UPDATE users/i)
    expect(params).toContain('uuid-001')
  })
})

describe('userRepository.updateLastLogin', () => {
  it('issues an UPDATE with the correct id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 })
    await userRepository.updateLastLogin('uuid-001')
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toMatch(/UPDATE users/i)
    expect(params).toContain('uuid-001')
  })
})

describe('userRepository.updatePassword', () => {
  it('issues an UPDATE with hashed password and id', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 })
    await userRepository.updatePassword('uuid-001', '$argon2id$new-hash')
    const [sql, params] = mockQuery.mock.calls[0]
    expect(sql).toMatch(/UPDATE users/i)
    expect(params).toContain('uuid-001')
    expect(params).toContain('$argon2id$new-hash')
  })
})
