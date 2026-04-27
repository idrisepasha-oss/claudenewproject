import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/auth/tokens'

type AuthSuccess = { ok: true; userId: string }
type AuthFailure = { ok: false; response: NextResponse }
export type AuthResult = AuthSuccess | AuthFailure

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    }
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verifyAccessToken(token)
    if (!payload.sub) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid token payload' }, { status: 401 }),
      }
    }
    return { ok: true, userId: payload.sub }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 }),
    }
  }
}
