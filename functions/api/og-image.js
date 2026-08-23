function notFound() {
  return new Response('OG image not configured', {
    status: 404,
    headers: { 'cache-control': 'no-store' },
  });
}

async function findAsset(db, slot) {
  return db.prepare(`
    SELECT object_key, mime_type
      FROM media_assets
     WHERE slot = ? AND active = 1
     ORDER BY created_at DESC
     LIMIT 1
  `).bind(slot).first();
}

export async function onRequestGet(context) {
  try {
    const db = context.env.WEDDING_DB;
    const bucket = context.env.WEDDING_MEDIA;
    if (!db || !bucket) return notFound();

    const asset = await findAsset(db, 'OG') || await findAsset(db, 'HERO');
    if (!asset?.object_key) return notFound();

    const object = await bucket.get(asset.object_key);
    if (!object) return notFound();

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('content-type', asset.mime_type || headers.get('content-type') || 'image/jpeg');
    headers.set('cache-control', 'public, max-age=300, stale-while-revalidate=86400');
    headers.set('etag', object.httpEtag);
    headers.set('x-content-type-options', 'nosniff');

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('OG_IMAGE_FAILED', error);
    return new Response('OG image unavailable', {
      status: 500,
      headers: { 'cache-control': 'no-store' },
    });
  }
}
