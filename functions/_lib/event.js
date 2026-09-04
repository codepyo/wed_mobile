export const EVENT_DAY_KEY = '2026-10-31';
export const EVENT_SIDE = new Set(['GROOM', 'BRIDE']);
export const DRAWING_COLORS = new Set(['#f4eee4', '#ef8a35', '#9aab84', '#b8a1c4', '#d96c5f']);
export const DRAWING_WIDTHS = new Set([3, 6, 10]);

let schemaReadyPromise = null;

export const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  },
});

export const cleanText = (value, max = 100) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

export function getSeoulDateKey(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function eventIsOpen(date = new Date()) {
  return getSeoulDateKey(date) === EVENT_DAY_KEY;
}

export function requireEventOpen() {
  return eventIsOpen() ? null : json({ ok: false, error: 'EVENT_NOT_OPEN' }, 403);
}

export function normalizeSide(value) {
  const side = cleanText(value, 10).toUpperCase();
  return EVENT_SIDE.has(side) ? side : '';
}

export function validSessionId(value) {
  const id = cleanText(value, 80);
  return /^[a-zA-Z0-9-]{16,80}$/.test(id) ? id : '';
}

export function validBatchId(value) {
  const id = cleanText(value, 80);
  return /^[a-zA-Z0-9-]{16,80}$/.test(id) ? id : '';
}

async function initializeEventSchema(db) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS event_sessions (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        side TEXT NOT NULL,
        cheer_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        entered_at TEXT NOT NULL,
        last_activity_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_event_sessions_entered ON event_sessions(entered_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_event_sessions_side ON event_sessions(side, status)`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS event_cheer_totals (
        id TEXT PRIMARY KEY,
        total INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS event_cheer_batches (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        delta INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_event_cheer_batches_session ON event_cheer_batches(session_id, created_at DESC)`),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS event_drawings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        nickname TEXT NOT NULL,
        side TEXT NOT NULL,
        caption TEXT,
        strokes_json TEXT NOT NULL,
        visible INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_event_drawings_feed ON event_drawings(status, visible, created_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_event_drawings_session ON event_drawings(session_id, status)`),
  ]);

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT OR IGNORE INTO event_cheer_totals(id, total, updated_at)
    VALUES ('GLOBAL', 0, ?)
  `).bind(now).run();
}

export async function ensureEventSchema(db) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = initializeEventSchema(db).catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }
  return schemaReadyPromise;
}

export async function getEventSession(db, sessionId) {
  const id = validSessionId(sessionId);
  if (!id) return null;
  return db.prepare(`
    SELECT id, nickname, side, cheer_count, entered_at, last_activity_at
      FROM event_sessions
     WHERE id = ? AND status = 'ACTIVE'
     LIMIT 1
  `).bind(id).first();
}

export async function getGlobalCheer(db) {
  const row = await db.prepare(`SELECT total FROM event_cheer_totals WHERE id = 'GLOBAL' LIMIT 1`).first();
  return Math.max(0, Number(row?.total || 0));
}

export function normalizeDrawingStrokes(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 80) return null;
  let totalPoints = 0;
  const strokes = [];

  for (const rawStroke of value) {
    const color = cleanText(rawStroke?.color, 12).toLowerCase();
    const width = Number(rawStroke?.width);
    if (!DRAWING_COLORS.has(color) || !DRAWING_WIDTHS.has(width) || !Array.isArray(rawStroke?.points)) return null;
    if (rawStroke.points.length < 1 || rawStroke.points.length > 800) return null;

    const points = [];
    for (const rawPoint of rawStroke.points) {
      if (!Array.isArray(rawPoint) || rawPoint.length !== 2) return null;
      const x = Number(rawPoint[0]);
      const y = Number(rawPoint[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
      points.push([Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]);
      totalPoints += 1;
      if (totalPoints > 2400) return null;
    }
    strokes.push({ color, width, points });
  }

  const encoded = JSON.stringify(strokes);
  if (encoded.length > 48000) return null;
  return { strokes, encoded, totalPoints };
}

export function actorFromRequest(request) {
  return request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    'admin';
}
