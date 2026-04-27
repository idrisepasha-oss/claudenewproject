import { NextRequest, NextResponse } from 'next/server'
import { authService, AuthError } from '@/auth/authService'
import { REFRESH_COOKIE, cookieOptions } from '@/lib/cookies'

export async function POST(req: NextRequest) {
  const rawToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (!rawToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(rawToken)
    const res = NextResponse.json({ accessToken })
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions)
    return res
  } catch (err) {
    if (err instanceof AuthError) {
      const res = NextResponse.json({ error: err.message }, { status: 401 })
      res.cookies.delete(REFRESH_COOKIE)
      return res
    }
    throw err
  }
}
