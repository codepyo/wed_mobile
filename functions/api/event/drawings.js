import {
  cleanText,
  ensureEventSchema,
  getEventSession,
  getGlobalCheer,
  json,
  normalizeDrawingStrokes,
  requireEventOpen,
  validSessionId,
} from '../../_lib/event.js';

function serializeDrawing(row) {
  let strokes = [];
  try {
    strokes = JSON.parse(row.strokes_json || '[]');
  } catch {
    strokes = [];
  }
  return {
    id: row.id,
    nickname: row.nickname,
    side: row.side,
    caption: row.caption || '',
    strokes,
    createdAt: row.created_at,
  };
}

async function recentDrawings(db, limit = 16) {
  const rows = await db.prepare(`
    SELECT id, nickname, side, caption, strokes_json, created_at
      FROM event_drawings
     WHERE status = 'ACTIVE' AND visible = 1
     ORDER BY created_at DESC
     LIMIT ?
  `).bind(limit).all();
  return (rows.results || []).map(serializeDrawing);
}

export async function onRequestGet(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const url = new URL(context.request.url);
    const sessionId = validSessionId(url.searchParams.get('sessionId'));
    const [drawings, globalCheer, session] = await Promise.all([
      recentDrawings(db),
      getGlobalCheer(db),
      sessionId ? getEventSession(db, sessionId) : Promise.resolve(null),
    ]);

    return json({
      ok: true,
      drawings,
      globalCheer,
      personalCheer: Number(session?.cheer_count || 0),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('EVENT_DRAWINGS_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR', drawings: [] }, 500);
  }
}

export async function onRequestPost(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const body = await context.request.json();
    const sessionId = validSessionId(body.sessionId);
    const caption = cleanText(body.caption, 60) || null;
    const normalized = normalizeDrawingStrokes(body.strokes);

    if (!sessionId) return json({ ok: false, error: 'INVALID_SESSION' }, 400);
    if (!normalized) return json({ ok: false, error: 'INVALID_DRAWING' }, 400);

    const session = await getEventSession(db, sessionId);
    if (!session) return json({ ok: false, error: 'SESSION_NOT_FOUND' }, 404);

    const existing = await db.prepare(`
      SELECT COUNT(*) AS count
        FROM event_drawings
       WHERE session_id = ? AND status = 'ACTIVE'
    `).bind(sessionId).first();
    if (Number(existing?.count || 0) >= 6) {
      return json({ ok: false, error: 'DRAWING_LIMIT_REACHED' }, 429);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`
        INSERT INTO event_drawings(
          id, session_id, nickname, side, caption, strokes_json,
          visible, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 'ACTIVE', ?, ?)
      `).bind(id, sessionId, session.nickname, session.side, caption, normalized.encoded, now, now),
      db.prepare(`
        UPDATE event_sessions
           SET last_activity_at = ?, updated_at = ?
         WHERE id = ? AND status = 'ACTIVE'
      `).bind(now, now, sessionId),
    ]);

    return json({
      ok: true,
      drawing: {
        id,
        nickname: session.nickname,
        side: session.side,
        caption: caption || '',
        strokes: normalized.strokes,
        createdAt: now,
      },
      remaining: Math.max(0, 5 - Number(existing?.count || 0)),
    }, 201);
  } catch (error) {
    console.error('EVENT_DRAWINGS_POST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
