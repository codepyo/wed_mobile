import {
  ensureEventSchema,
  getEventSession,
  json,
  requireEventOpen,
  validSessionId,
} from '../../_lib/event.js';

export async function onRequestGet(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    await ensureEventSchema(db);
    const url = new URL(context.request.url);
    const sessionId = validSessionId(url.searchParams.get('sessionId'));
    if (!sessionId) return json({ ok: false, error: 'INVALID_SESSION', assets: [] }, 400);

    const session = await getEventSession(db, sessionId);
    if (!session) return json({ ok: false, error: 'SESSION_NOT_FOUND', assets: [] }, 404);
    if (Number(session.cheer_count || 0) < 5) return json({ ok: false, error: 'SECRET_LOCKED', assets: [] }, 403);

    const rows = await db.prepare(`
      SELECT id, mime_type, width, height, object_position, alt_text, sort_order, created_at
        FROM media_assets
       WHERE slot = 'EVENT_SECRET' AND active = 1
       ORDER BY COALESCE(sort_order, 999999), created_at DESC
       LIMIT 12
    `).all();

    const assets = (rows.results || []).map((row) => ({
      id: row.id,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      objectPosition: row.object_position || '50% 50%',
      altText: row.alt_text || 'Halloween Wedding secret photo',
      sortOrder: row.sort_order,
      url: `/api/event/secret/${encodeURIComponent(row.id)}?sessionId=${encodeURIComponent(sessionId)}`,
    }));

    return json({ ok: true, unlocked: true, assets });
  } catch (error) {
    console.error('EVENT_SECRET_MANIFEST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR', assets: [] }, 500);
  }
}
