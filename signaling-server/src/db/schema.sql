-- signaling-server/src/db/schema.sql
-- Run: PGPASSWORD=localdevpassword psql -h localhost -U rda_app -d rda -f schema.sql

-- ── Custom ENUM types ──────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE log_level AS ENUM ('debug','info','warn','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active','ended','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ──────────────────────────────────────────────────────────────────
-- Column names must match EXACTLY what users.ts queries

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL DEFAULT '',
  display_name        TEXT NOT NULL,
  avatar_url          TEXT,
  role                TEXT NOT NULL DEFAULT 'user',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  two_fa_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_count  INTEGER DEFAULT 0,       -- used in users.ts verifyPassword
  locked_until        TIMESTAMPTZ,             -- used in users.ts lockout check
  last_login_at       TIMESTAMPTZ,             -- used in users.ts reset on success
  last_login_ip       TEXT,                    -- used in admin.ts /admin/users
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User profiles ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name      TEXT,
  bio            TEXT,
  timezone       TEXT DEFAULT 'UTC',
  locale         TEXT DEFAULT 'en',
  preferred_lang TEXT DEFAULT 'en',
  phone          TEXT,
  country_code   TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile row when user is inserted
CREATE OR REPLACE FUNCTION fn_create_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_user_profile ON users;
CREATE TRIGGER trg_create_user_profile
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION fn_create_user_profile();

-- ── User limits (used by admin checkSessionLimits) ─────────────────────────

CREATE TABLE IF NOT EXISTS user_limits (
  user_id                  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  max_concurrent_sessions  INTEGER DEFAULT 2,
  max_sessions_per_day     INTEGER DEFAULT 20,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auth sessions (refresh tokens) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions_auth (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  device_info   JSONB DEFAULT '{}',
  ip_address    TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Remote desktop sessions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  host_display_id  TEXT NOT NULL,
  controller_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  controller_name  TEXT,
  status           session_status NOT NULL DEFAULT 'active',
  start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time         TIMESTAMPTZ,
  duration_seconds INTEGER,
  screen_audio     BOOLEAN DEFAULT FALSE,
  video_call       BOOLEAN DEFAULT FALSE,
  control_enabled  BOOLEAN DEFAULT FALSE,
  quality_preset   TEXT DEFAULT '720p',
  summary          TEXT,
  ai_summary       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Session stats ──────────────────────────────────────────────────────────
-- Primary key is session_id — matches ON CONFLICT (session_id) in sessions.ts

CREATE TABLE IF NOT EXISTS session_stats (
  session_id        UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  bytes_sent        BIGINT DEFAULT 0,
  bytes_received    BIGINT DEFAULT 0,
  avg_bitrate_kbps  NUMERIC,
  avg_fps           NUMERIC,
  packet_loss_pct   NUMERIC,
  rtt_ms_avg        NUMERIC,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Session transcripts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_transcripts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  full_text    TEXT,
  ai_summary   TEXT,
  key_topics   TEXT[],
  action_items TEXT[],
  language     TEXT DEFAULT 'en',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Favourites ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS favourites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remote_id    TEXT NOT NULL,
  label        TEXT,
  last_used_at TIMESTAMPTZ,
  use_count    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, remote_id)
);

-- ── User logs (admin.ts logUserAction writes here) ─────────────────────────

CREATE TABLE IF NOT EXISTS user_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  level       log_level DEFAULT 'info',
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── System health (admin.ts recordSystemHealth writes here) ────────────────

CREATE TABLE IF NOT EXISTS system_health (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_pct             NUMERIC,
  mem_used_mb         INTEGER,
  mem_total_mb        INTEGER,
  active_sessions     INTEGER DEFAULT 0,
  active_connections  INTEGER DEFAULT 0,
  db_pool_used        INTEGER DEFAULT 0,
  db_pool_total       INTEGER DEFAULT 0,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── System config (admin.ts getSystemConfig / setSystemConfig) ─────────────

CREATE TABLE IF NOT EXISTS system_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default config values
INSERT INTO system_config (key, value, description)
VALUES
  ('max_concurrent_sessions', '2',  'Max active sessions per user at once'),
  ('max_sessions_per_day',    '20', 'Max sessions per user per 24 hours')
ON CONFLICT (key) DO NOTHING;

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_host_id      ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status        ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time    ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_favourites_user_id     ON favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id      ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at   ON user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id  ON user_sessions_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires  ON user_sessions_auth(expires_at);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded ON system_health(recorded_at DESC);