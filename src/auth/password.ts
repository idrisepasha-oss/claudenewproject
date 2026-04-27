import argon2 from 'argon2'

const MIN_PASSWORD_LENGTH = 8

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MiB
  timeCost: 3,
  parallelism: 4,
}

export async function hashPassword(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
  return argon2.hash(plaintext, ARGON2_OPTIONS)
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (!plaintext) return false
  try {
    return await argon2.verify(hash, plaintext)
  } catch {
    return false
  }
}
