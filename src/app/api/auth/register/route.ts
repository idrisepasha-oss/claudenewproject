import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService, AuthError } from '@/auth/authService'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
})

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError && err.code === 'EMAIL_TAKEN') {
      return NextResponse.json(
        { message: 'If this email is not registered, you will receive a confirmation.' },
        { status: 200 }
      )
    }
    throw err
  }
}
