import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/auth/authService'
import { REFRESH_COOKIE } from '@/lib/cookies'

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (rawToken) await authService.logout(rawToken)
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(REFRESH_COOKIE)
  return res
}
