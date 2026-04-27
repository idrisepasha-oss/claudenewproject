import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService, AuthError } from '@/auth/authService'
import { REFRESH_COOKIE, cookieOptions } from '@/lib/cookies'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { accessToken, refreshToken, user } = await authService.login(
      parsed.data.email,
      parsed.data.password
    )
    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    })
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions)
    return res
  } catch (err) {
    if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    throw err
  }
}
