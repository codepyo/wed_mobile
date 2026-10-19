const notFound = () => new Response('Not Found', {
  status: 404,
  headers: { 'cache-control': 'no-store, private' },
});

function applyRangeHeaders(headers, object) {
  const range = object.range;
  if (!range) {
    headers.set('content-length', String(object.size));
    return false;
  }

  let start = 0;
  let end = object.size - 1;

  if ('suffix' in range && Number.isFinite(range.suffix)) {
    const suffix = Math.max(0, Number(range.suffix));
    start = Math.max(0, object.size - suffix);
  } else {
    start = Math.max(0, Number(range.offset || 0));
    if (Number.isFinite(range.length)) {
      end = Math.min(object.size - 1, start + Math.max(0, Number(range.length)) - 1);
    }
  }

  const length = Math.max(0, end - start + 1);
  headers.set('content-range', `bytes ${start}-${end}/${object.size}`);
  headers.set('content-length', String(length));
  return true;
}

async function resolveAsset(context) {
  const id = String(context.params?.id || '').trim();
  if (!id) return null;
  return context.env.WEDDING_DB.prepare(`
    SELECT id, object_key, mime_type, size_bytes, alt_text
      FROM media_assets
     WHERE id = ?
       AND slot = 'TRAILER'
       AND active = 1
     LIMIT 1
  `).bind(id).first();
}

async function serve(context, headOnly = false) {
  try {
    const row = await resolveAsset(context);
    if (!row?.object_key) return notFound();

    const rangeRequested = context.request.headers.has('range');
    const object = await context.env.WEDDING_MEDIA.get(
      row.object_key,
      rangeRequested ? { range: context.request.headers } : undefined,
    );
    if (!object) return notFound();

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('content-type', row.mime_type || headers.get('content-type') || 'video/mp4');
    headers.set('cache-control', 'private, max-age=3600');
    headers.set('content-disposition', 'inline');
    headers.set('accept-ranges', 'bytes');
    headers.set('x-content-type-options', 'nosniff');
    if (object.httpEtag) headers.set('etag', object.httpEtag);

    const partial = rangeRequested && applyRangeHeaders(headers, object);
    if (!partial) headers.set('content-length', String(object.size));

    return new Response(headOnly ? null : object.body, {
      status: partial ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error('ADMIN_TRAILER_STREAM_FAILED', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'cache-control': 'no-store, private' },
    });
  }
}

export async function onRequestGet(context) {
  return serve(context, false);
}

export async function onRequestHead(context) {
  return serve(context, true);
}
