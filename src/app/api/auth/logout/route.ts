import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/auth/authService'
import { REFRESH_COOKIE } from '@/lib/cookies'
import { auditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const rawToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (rawToken) {
    await authService.logout(rawToken)
    await auditLog('logout', { ipAddress })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(REFRESH_COOKIE)
  return res
}
