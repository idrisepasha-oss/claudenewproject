import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashToken } from '@/auth/tokens'
import { hashPassword } from '@/auth/password'
import { pool } from '@/lib/db'
import { auditLog } from '@/lib/audit'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const userAgent = req.headers.get('user-agent') ?? undefined

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const newHash = await hashPassword(parsed.data.password)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Atomically claim the token — prevents race-condition double-use
    const { rows } = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [hashToken(parsed.data.token)]
    )

    if (!rows.length) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const userId: string = rows[0].user_id
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [newHash, userId]
    )
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    )
    await client.query('COMMIT')
    await auditLog('password_reset_completed', { userId, ipAddress, userAgent })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return NextResponse.json({ message: 'Password updated successfully' })
}
