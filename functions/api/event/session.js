import {
  cleanText,
  ensureEventSchema,
  getEventEntryNumber,
  getEventSession,
  getGlobalCheer,
  json,
  normalizeSide,
  requireEventOpen,
  validSessionId,
} from '../../_lib/event.js';

function sessionPayload(session, entryNumber, globalCheer, serverTime) {
  return {
    ok: true,
    sessionId: session.id,
    nickname: session.nickname,
    side: session.side,
    personalCheer: Number(session.cheer_count || 0),
    globalCheer,
    enteredAt: session.entered_at,
    entryNumber: Math.max(0, Number(entryNumber || 0)),
    serverTime,
  };
}

export async function onRequestGet(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const sessionId = validSessionId(new URL(context.request.url).searchParams.get('sessionId'));
    if (!sessionId) return json({ ok: false, error: 'INVALID_SESSION' }, 400);

    const session = await getEventSession(db, sessionId);
    if (!session) return json({ ok: false, error: 'SESSION_NOT_FOUND' }, 404);

    const entryNumber = Number(session.entry_number || 0) || await getEventEntryNumber(db, session.id, true);
    const globalCheer = await getGlobalCheer(db);
    return json(sessionPayload(session, entryNumber, globalCheer, new Date().toISOString()));
  } catch (error) {
    console.error('EVENT_SESSION_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);

    const body = await context.request.json();
    const nickname = cleanText(body.nickname, 24);
    const side = normalizeSide(body.side);
    const requestedId = validSessionId(body.sessionId);

    if (!nickname) return json({ ok: false, error: 'NICKNAME_REQUIRED' }, 400);
    if (!side) return json({ ok: false, error: 'INVALID_SIDE' }, 400);

    const now = new Date().toISOString();
    let session = requestedId ? await getEventSession(db, requestedId) : null;

    if (session) {
      await db.prepare(`
        UPDATE event_sessions
           SET nickname = ?, side = ?, last_activity_at = ?, updated_at = ?
         WHERE id = ? AND status = 'ACTIVE'
      `).bind(nickname, side, now, now, session.id).run();
      session = await getEventSession(db, session.id);
    } else {
      const id = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO event_sessions(
          id, nickname, side, cheer_count, status, entered_at, last_activity_at, updated_at
        ) VALUES (?, ?, ?, 0, 'ACTIVE', ?, ?, ?)
      `).bind(id, nickname, side, now, now, now).run();
      session = await getEventSession(db, id);
    }

    const entryNumber = Number(session.entry_number || 0) || await getEventEntryNumber(db, session.id, true);
    const globalCheer = await getGlobalCheer(db);
    return json(sessionPayload(session, entryNumber, globalCheer, now), 201);
  } catch (error) {
    console.error('EVENT_SESSION_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
