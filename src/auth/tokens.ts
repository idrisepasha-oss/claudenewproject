import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { randomBytes, createHash } from 'crypto'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
}
const secret = new TextEncoder().encode(
  jwtSecret ?? 'dev-secret-change-in-production-min-32-chars!!'
)

export interface AccessTokenPayload extends JWTPayload {
  sub: string
  role?: string
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, 'jti' | 'iat' | 'exp'>,
  ttl: string | number
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .setJti(randomBytes(16).toString('hex'))
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
  return payload as AccessTokenPayload
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
