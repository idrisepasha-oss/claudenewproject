CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT NOT NULL,
  email_lower     TEXT NOT NULL GENERATED ALWAYS AS (lower(email)) STORED,
  password_hash   TEXT NOT NULL,
  display_name    TEXT,
  email_verified_at TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lower_unique UNIQUE (email_lower)
);

CREATE INDEX idx_users_email_lower ON users (email_lower);
