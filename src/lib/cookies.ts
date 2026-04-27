import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export const cookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: COOKIE_MAX_AGE,
}

export { REFRESH_COOKIE }
