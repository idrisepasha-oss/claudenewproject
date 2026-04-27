import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService, AuthError } from '@/auth/authService'
import { REFRESH_COOKIE, cookieOptions } from '@/lib/cookies'
import { auditLog } from '@/lib/audit'
import { checkLoginRateLimit } from '@/lib/rateLimit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  const ipAddress = getIp(req)
  const userAgent = req.headers.get('user-agent') ?? undefined

  const rateLimited = await checkLoginRateLimit(ipAddress)
  if (rateLimited) return rateLimited

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
    await auditLog('login_success', { userId: user.id, ipAddress, userAgent })
    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    })
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions)
    return res
  } catch (err) {
    if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
      await auditLog('login_failed', {
        ipAddress,
        userAgent,
        metadata: { email: parsed.data.email },
      })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    throw err
  }
}
