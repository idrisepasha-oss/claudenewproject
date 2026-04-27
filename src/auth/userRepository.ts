import { pool } from '@/lib/db'
import type { User, CreateUserInput } from '@/auth/types'

function mapRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: (row.display_name as string) ?? null,
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at as string) : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email_lower = $1 LIMIT 1',
      [email.toLowerCase()]
    )
    return rows.length ? mapRow(rows[0]) : null
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    )
    return rows.length ? mapRow(rows[0]) : null
  },

  async create(input: CreateUserInput): Promise<User> {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.email, input.passwordHash, input.displayName ?? null]
    )
    return mapRow(rows[0])
  },

  async markEmailVerified(id: string): Promise<void> {
    await pool.query(
      'UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1',
      [id]
    )
  },

  async updateLastLogin(id: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1',
      [id]
    )
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [passwordHash, id]
    )
  },
}
