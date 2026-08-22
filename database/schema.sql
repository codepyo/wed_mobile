PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rsvp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('GROOM', 'BRIDE')),
  attendance TEXT NOT NULL CHECK (attendance IN ('YES', 'NO')),
  guest_count INTEGER CHECK (guest_count IS NULL OR (guest_count >= 1 AND guest_count <= 20)),
  meal TEXT CHECK (meal IS NULL OR meal IN ('YES', 'NO', 'UNKNOWN')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rsvp_created_at ON rsvp(created_at);
CREATE INDEX IF NOT EXISTS idx_rsvp_side ON rsvp(side);
CREATE INDEX IF NOT EXISTS idx_rsvp_attendance ON rsvp(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvp_status ON rsvp(status);

CREATE TABLE IF NOT EXISTS guestbook (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  side TEXT CHECK (side IS NULL OR side IN ('GROOM', 'BRIDE')),
  message TEXT NOT NULL,
  delete_hash TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at);
CREATE INDEX IF NOT EXISTS idx_guestbook_visible ON guestbook(visible);
CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook(status);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  slot TEXT NOT NULL,
  object_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  object_position TEXT,
  alt_text TEXT,
  sort_order INTEGER,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_slot ON media_assets(slot, active, sort_order);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  summary TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at);

INSERT OR IGNORE INTO site_settings(key, value, updated_at) VALUES
  ('rsvp_enabled', 'true', datetime('now')),
  ('guestbook_enabled', 'true', datetime('now')),
  ('guestbook_write_enabled', 'true', datetime('now')),
  ('music_enabled', 'false', datetime('now'));
