import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

const WINDOW_MINUTES = 15
const MAX_FAILURES = 5

export async function checkLoginRateLimit(ipAddress: string): Promise<NextResponse | null> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM auth_audit_log
     WHERE ip_address = $1
       AND event_type = 'login_failed'
       AND created_at > now() - interval '${WINDOW_MINUTES} minutes'`,
    [ipAddress]
  )
  if (parseInt(rows[0].count as string, 10) >= MAX_FAILURES) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(WINDOW_MINUTES * 60) } }
    )
  }
  return null
}
