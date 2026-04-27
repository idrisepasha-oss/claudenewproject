import { pool } from '@/lib/db'
import type { RefreshToken } from '@/auth/types'

function mapRow(row: Record<string, unknown>): RefreshToken {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tokenHash: row.token_hash as string,
    familyId: row.family_id as string,
    expiresAt: new Date(row.expires_at as string),
    revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
    replacedById: (row.replaced_by_id as string) ?? null,
    createdAt: new Date(row.created_at as string),
  }
}

export const refreshTokenRepository = {
  async create(input: {
    userId: string
    tokenHash: string
    familyId: string
    expiresAt: Date
  }): Promise<RefreshToken> {
    const { rows } = await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.userId, input.tokenHash, input.familyId, input.expiresAt]
    )
    return mapRow(rows[0])
  },

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash]
    )
    return rows.length ? mapRow(rows[0]) : null
  },

  async rotate(oldId: string, newTokenHash: string, newFamilyId: string, expiresAt: Date): Promise<RefreshToken> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1',
        [oldId]
      )
      const { rows } = await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
         SELECT user_id, $1, $2, $3 FROM refresh_tokens WHERE id = $4
         RETURNING *`,
        [newTokenHash, newFamilyId, expiresAt, oldId]
      )
      await client.query(
        'UPDATE refresh_tokens SET replaced_by_id = $1 WHERE id = $2',
        [rows[0].id, oldId]
      )
      await client.query('COMMIT')
      return mapRow(rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async revokeFamily(familyId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL',
      [familyId]
    )
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    )
  },
}
