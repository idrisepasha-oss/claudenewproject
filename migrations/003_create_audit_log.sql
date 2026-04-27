CREATE TABLE auth_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user_id    ON auth_audit_log (user_id);
CREATE INDEX idx_audit_log_event_type ON auth_audit_log (event_type);
CREATE INDEX idx_audit_log_created_at ON auth_audit_log (created_at DESC);
