import {
  ensureEventSchema,
  getEventSession,
  getGlobalCheer,
  json,
  requireEventOpen,
  validSessionId,
} from '../../_lib/event.js';

export async function onRequestPost(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const body = await context.request.json();
    const sessionId = validSessionId(body.sessionId);
    const delta = Number(body.delta);

    if (!sessionId) return json({ ok: false, error: 'INVALID_SESSION' }, 400);
    if (!Number.isInteger(delta) || delta < 1 || delta > 200) {
      return json({ ok: false, error: 'INVALID_DELTA' }, 400);
    }

    const session = await getEventSession(db, sessionId);
    if (!session) return json({ ok: false, error: 'SESSION_NOT_FOUND' }, 404);

    const now = new Date().toISOString();
    await db.batch([
      db.prepare(`
        UPDATE event_sessions
           SET cheer_count = cheer_count + ?, last_activity_at = ?, updated_at = ?
         WHERE id = ? AND status = 'ACTIVE'
      `).bind(delta, now, now, sessionId),
      db.prepare(`
        UPDATE event_cheer_totals
           SET total = total + ?, updated_at = ?
         WHERE id = 'GLOBAL'
      `).bind(delta, now),
    ]);

    const [updatedSession, globalCheer] = await Promise.all([
      getEventSession(db, sessionId),
      getGlobalCheer(db),
    ]);

    return json({
      ok: true,
      personalCheer: Number(updatedSession?.cheer_count || 0),
      globalCheer,
      flushed: delta,
      serverTime: now,
    });
  } catch (error) {
    console.error('EVENT_CHEER_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
