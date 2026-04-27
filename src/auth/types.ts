export interface User {
  id: string
  email: string
  displayName: string | null
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  passwordHash: string
  displayName?: string
}

export interface RefreshToken {
  id: string
  userId: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt: Date | null
  replacedById: string | null
  createdAt: Date
}
