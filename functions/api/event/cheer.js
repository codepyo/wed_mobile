import {
  ensureEventSchema,
  getEventSession,
  getGlobalCheer,
  json,
  requireEventOpen,
  validBatchId,
  validSessionId,
} from '../../_lib/event.js';

async function responseState(db, sessionId, batchId, delta, duplicate = false) {
  const [updatedSession, globalCheer] = await Promise.all([
    getEventSession(db, sessionId),
    getGlobalCheer(db),
  ]);
  return json({
    ok: true,
    batchId,
    personalCheer: Number(updatedSession?.cheer_count || 0),
    globalCheer,
    flushed: delta,
    duplicate,
    serverTime: new Date().toISOString(),
  });
}

export async function onRequestPost(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const body = await context.request.json();
    const sessionId = validSessionId(body.sessionId);
    const batchId = validBatchId(body.batchId);
    const delta = Number(body.delta);

    if (!sessionId) return json({ ok: false, error: 'INVALID_SESSION' }, 400);
    if (!batchId) return json({ ok: false, error: 'INVALID_BATCH' }, 400);
    if (!Number.isInteger(delta) || delta < 1 || delta > 200) {
      return json({ ok: false, error: 'INVALID_DELTA' }, 400);
    }

    const session = await getEventSession(db, sessionId);
    if (!session) return json({ ok: false, error: 'SESSION_NOT_FOUND' }, 404);

    const existing = await db.prepare(`
      SELECT id, session_id, delta
        FROM event_cheer_batches
       WHERE id = ?
       LIMIT 1
    `).bind(batchId).first();
    if (existing) {
      if (existing.session_id !== sessionId || Number(existing.delta) !== delta) {
        return json({ ok: false, error: 'BATCH_CONFLICT' }, 409);
      }
      return responseState(db, sessionId, batchId, delta, true);
    }

    const now = new Date().toISOString();
    try {
      await db.batch([
        db.prepare(`
          INSERT INTO event_cheer_batches(id, session_id, delta, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(batchId, sessionId, delta, now),
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
    } catch (batchError) {
      const raced = await db.prepare(`
        SELECT id, session_id, delta
          FROM event_cheer_batches
         WHERE id = ?
         LIMIT 1
      `).bind(batchId).first();
      if (raced && raced.session_id === sessionId && Number(raced.delta) === delta) {
        return responseState(db, sessionId, batchId, delta, true);
      }
      throw batchError;
    }

    return responseState(db, sessionId, batchId, delta, false);
  } catch (error) {
    console.error('EVENT_CHEER_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
