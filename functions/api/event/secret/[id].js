import {
  ensureEventSchema,
  getEventSession,
  requireEventOpen,
  validSessionId,
} from '../../../_lib/event.js';

const notFound = () => new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } });

export async function onRequestGet(context) {
  const closed = requireEventOpen();
  if (closed) return closed;

  try {
    const db = context.env.WEDDING_DB;
    const bucket = context.env.WEDDING_MEDIA;
    if (!bucket) return notFound();
    await ensureEventSchema(db);

    const id = String(context.params?.id || '').trim();
    const url = new URL(context.request.url);
    const sessionId = validSessionId(url.searchParams.get('sessionId'));
    if (!id || !sessionId) return notFound();

    const session = await getEventSession(db, sessionId);
    if (!session || Number(session.cheer_count || 0) < 5) return notFound();

    const row = await db.prepare(`
      SELECT object_key, mime_type
        FROM media_assets
       WHERE id = ? AND slot = 'EVENT_SECRET' AND active = 1
       LIMIT 1
    `).bind(id).first();
    if (!row?.object_key) return notFound();

    const object = await bucket.get(row.object_key);
    if (!object) return notFound();

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('content-type', row.mime_type || headers.get('content-type') || 'image/jpeg');
    headers.set('cache-control', 'private, no-store');
    headers.set('content-length', String(object.size));
    if (object.httpEtag) headers.set('etag', object.httpEtag);
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error('EVENT_SECRET_MEDIA_FAILED', error);
    return new Response('Internal Server Error', { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}
