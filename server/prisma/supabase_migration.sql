-- ============================================================
-- LifeSaver AI — Supabase SQL Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE emergency_type AS ENUM (
  'MEDICAL', 'WOMEN_SAFETY', 'FIRE', 'FLOOD', 'EARTHQUAKE'
);

CREATE TYPE sos_status AS ENUM (
  'ACTIVE', 'RESOLVED', 'FALSE_ALARM'
);

-- ── users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  name         TEXT,
  email        TEXT UNIQUE,
  phone        TEXT,
  firebase_uid TEXT UNIQUE
);

-- ── sos_events ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_events (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  type         emergency_type NOT NULL,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  city         TEXT,
  status       sos_status DEFAULT 'ACTIVE',
  resolved_at  TIMESTAMPTZ,
  source       TEXT DEFAULT 'web-pwa',
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- ── helpers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS helpers (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  role        TEXT DEFAULT 'Volunteer',
  verified    BOOLEAN DEFAULT false,
  available   BOOLEAN DEFAULT true,
  rating      FLOAT DEFAULT 5.0,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  user_id     TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- ── alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  type         emergency_type NOT NULL,
  message      TEXT NOT NULL,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  active       BOOLEAN DEFAULT true,
  sos_event_id TEXT REFERENCES sos_events(id) ON DELETE SET NULL
);

-- ── emergency_contacts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  relation   TEXT NOT NULL,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ── hospitals (static data) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name     TEXT NOT NULL,
  phone    TEXT NOT NULL,
  lat      DOUBLE PRECISION NOT NULL,
  lng      DOUBLE PRECISION NOT NULL,
  city     TEXT DEFAULT 'Chennai',
  beds     INTEGER DEFAULT 0,
  open_24h BOOLEAN DEFAULT true
);

-- ── Seed: Hospital data ───────────────────────────────────────
INSERT INTO hospitals (name, phone, lat, lng, beds, city) VALUES
  ('Government General Hospital', '044-2530-5000', 13.0780, 80.2785, 1500, 'Chennai'),
  ('Apollo Hospital',             '044-2829-0200', 13.0600, 80.2500,  500, 'Chennai'),
  ('MIOT International',          '044-4200-2288', 13.0100, 80.1900,  250, 'Chennai'),
  ('Fortis Malar Hospital',       '044-4289-2222', 13.0107, 80.2649,  200, 'Chennai'),
  ('Stanley Medical College',     '044-2528-5000', 13.1086, 80.2888, 1200, 'Chennai')
ON CONFLICT DO NOTHING;

-- ── Enable Row Level Security ─────────────────────────────────
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals       ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies: public can read hospitals and alerts ────────
CREATE POLICY "Anyone can read hospitals"
  ON hospitals FOR SELECT USING (true);

CREATE POLICY "Anyone can read active alerts"
  ON alerts FOR SELECT USING (active = true);

CREATE POLICY "Anyone can insert sos_events"
  ON sos_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read sos_events"
  ON sos_events FOR SELECT USING (true);

-- ── Enable realtime for live updates (two-tab demo trick) ────
-- Run this in Supabase: Database → Replication → enable for sos_events
-- OR use this SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
