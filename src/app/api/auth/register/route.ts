import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService, AuthError } from '@/auth/authService'
import { hashPassword } from '@/auth/password'
import { auditLog } from '@/lib/audit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
})

const GENERIC_OK = { message: 'If this email is not registered, you will receive a confirmation.' }

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

  try {
    const user = await authService.register(
      parsed.data.email,
      parsed.data.password,
      parsed.data.displayName
    )
    await auditLog('register_success', { userId: user.id, ipAddress, userAgent })
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError && err.code === 'EMAIL_TAKEN') {
      // Equalize timing with the success path to prevent email enumeration via response time
      await hashPassword(parsed.data.password).catch(() => null)
      return NextResponse.json(GENERIC_OK, { status: 200 })
    }
    throw err
  }
}
