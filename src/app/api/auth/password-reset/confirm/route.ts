import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashToken } from '@/auth/tokens'
import { hashPassword } from '@/auth/password'
import { userRepository } from '@/auth/userRepository'
import { refreshTokenRepository } from '@/auth/refreshTokenRepository'
import { pool } from '@/lib/db'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { rows } = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     LIMIT 1`,
    [hashToken(parsed.data.token)]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
  }

  const record = rows[0]
  const newHash = await hashPassword(parsed.data.password)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await userRepository.updatePassword(record.user_id, newHash)
    await client.query(
      'UPDATE password_reset_tokens SET used_at = now() WHERE id = $1',
      [record.id]
    )
    await refreshTokenRepository.revokeAllForUser(record.user_id)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return NextResponse.json({ message: 'Password updated successfully' })
}
