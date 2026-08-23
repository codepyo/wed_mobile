const notFound = () => new Response('Not Found', {
  status: 404,
  headers: { 'cache-control': 'no-store' },
});

export async function onRequestGet(context) {
  try {
    const id = String(context.params?.id || '').trim();
    if (!id) return notFound();

    const row = await context.env.WEDDING_DB.prepare(`
      SELECT object_key, mime_type
        FROM media_assets
       WHERE id = ? AND active = 1
       LIMIT 1
    `).bind(id).first();

    if (!row?.object_key) return notFound();

    const object = await context.env.WEDDING_MEDIA.get(row.object_key);
    if (!object) return notFound();

    const headers = new Headers();
    headers.set('content-type', row.mime_type || object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    if (object.httpEtag) headers.set('etag', object.httpEtag);

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error('PUBLIC_MEDIA_OBJECT_FAILED', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
