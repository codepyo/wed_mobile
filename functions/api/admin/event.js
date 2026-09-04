import {
  actorFromRequest,
  cleanText,
  ensureEventSchema,
  json,
} from '../../_lib/event.js';

async function readEventAdmin(db) {
  const [summary, cheer, sessions, drawings, secret] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*) AS sessions,
        SUM(CASE WHEN side = 'GROOM' THEN 1 ELSE 0 END) AS groom_sessions,
        SUM(CASE WHEN side = 'BRIDE' THEN 1 ELSE 0 END) AS bride_sessions,
        COALESCE(SUM(cheer_count), 0) AS session_cheers
      FROM event_sessions
      WHERE status = 'ACTIVE'
    `).first(),
    db.prepare(`SELECT total FROM event_cheer_totals WHERE id = 'GLOBAL' LIMIT 1`).first(),
    db.prepare(`
      SELECT id, nickname, side, cheer_count, entered_at, last_activity_at
        FROM event_sessions
       WHERE status = 'ACTIVE'
       ORDER BY entered_at DESC
       LIMIT 200
    `).all(),
    db.prepare(`
      SELECT id, session_id, nickname, side, caption, visible, status, created_at, updated_at
        FROM event_drawings
       WHERE status IN ('ACTIVE', 'DELETED')
       ORDER BY created_at DESC
       LIMIT 200
    `).all(),
    db.prepare(`
      SELECT COUNT(*) AS count
        FROM media_assets
       WHERE slot = 'EVENT_SECRET' AND active = 1
    `).first(),
  ]);

  const drawingRows = drawings.results || [];
  return {
    ok: true,
    summary: {
      sessions: Number(summary?.sessions || 0),
      groomSessions: Number(summary?.groom_sessions || 0),
      brideSessions: Number(summary?.bride_sessions || 0),
      globalCheer: Number(cheer?.total || 0),
      sessionCheers: Number(summary?.session_cheers || 0),
      drawings: drawingRows.filter((row) => row.status === 'ACTIVE').length,
      visibleDrawings: drawingRows.filter((row) => row.status === 'ACTIVE' && Number(row.visible) === 1).length,
      secretAssets: Number(secret?.count || 0),
    },
    sessions: sessions.results || [],
    drawings: drawingRows,
    generatedAt: new Date().toISOString(),
  };
}

export async function onRequestGet(context) {
  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    return json(await readEventAdmin(db));
  } catch (error) {
    console.error('ADMIN_EVENT_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const body = await context.request.json();
    const action = cleanText(body.action, 30).toUpperCase();
    const id = cleanText(body.id, 80);
    if (!id) return json({ ok: false, error: 'ID_REQUIRED' }, 400);
    if (!['DRAWING_HIDE', 'DRAWING_SHOW', 'DRAWING_DELETE'].includes(action)) {
      return json({ ok: false, error: 'INVALID_ACTION' }, 400);
    }

    const existing = await db.prepare(`
      SELECT id, nickname, caption, status, visible
        FROM event_drawings
       WHERE id = ?
       LIMIT 1
    `).bind(id).first();
    if (!existing) return json({ ok: false, error: 'NOT_FOUND' }, 404);

    const now = new Date().toISOString();
    if (action === 'DRAWING_DELETE') {
      await db.prepare(`
        UPDATE event_drawings
           SET status = 'DELETED', visible = 0, updated_at = ?
         WHERE id = ?
      `).bind(now, id).run();
    } else {
      await db.prepare(`
        UPDATE event_drawings
           SET visible = ?, status = 'ACTIVE', updated_at = ?
         WHERE id = ?
      `).bind(action === 'DRAWING_SHOW' ? 1 : 0, now, id).run();
    }

    const summary = `${action} · ${existing.nickname}${existing.caption ? ` · ${existing.caption.slice(0, 40)}` : ''}`;
    await db.prepare(`
      INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
      VALUES (?, ?, ?, 'event_drawing', ?, ?, ?)
    `).bind(crypto.randomUUID(), actorFromRequest(context.request), action, id, summary, now).run();

    return json(await readEventAdmin(db));
  } catch (error) {
    console.error('ADMIN_EVENT_POST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
