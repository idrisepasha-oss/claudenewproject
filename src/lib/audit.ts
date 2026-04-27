import { pool } from '@/lib/db'

export type AuditEvent =
  | 'register_success'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'token_reuse_detected'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verified'

interface AuditOptions {
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export async function auditLog(event: AuditEvent, opts: AuditOptions = {}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO auth_audit_log (user_id, event_type, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        opts.userId ?? null,
        event,
        opts.ipAddress ?? null,
        opts.userAgent ?? null,
        opts.metadata ? JSON.stringify(opts.metadata) : null,
      ]
    )
  } catch {
    // Audit failure must never disrupt auth flow
  }
}
