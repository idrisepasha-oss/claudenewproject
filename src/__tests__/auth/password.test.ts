import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/auth/password'

describe('hashPassword', () => {
  it('returns a non-empty string', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('produces different hashes for the same input', async () => {
    const h1 = await hashPassword('same-password')
    const h2 = await hashPassword('same-password')
    expect(h1).not.toBe(h2)
  })

  it('rejects empty passwords', async () => {
    await expect(hashPassword('')).rejects.toThrow()
  })

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow()
  })
})

describe('verifyPassword', () => {
  it('returns true for a correct password', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(await verifyPassword('correct-horse-battery', hash)).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('returns false for an empty candidate', async () => {
    const hash = await hashPassword('correct-horse-battery')
    expect(await verifyPassword('', hash)).toBe(false)
  })
})
