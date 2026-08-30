const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

export async function onRequestGet(context) {
  try {
    const rows = await context.env.WEDDING_DB.prepare(`
      SELECT id, slot, mime_type, size_bytes, width, height, object_position, alt_text, sort_order, created_at
        FROM media_assets
       WHERE active = 1
       ORDER BY CASE slot
                  WHEN 'HERO' THEN 1
                  WHEN 'GALLERY' THEN 2
                  WHEN 'OG' THEN 3
                  WHEN 'BGM' THEN 4
                  ELSE 9
                END,
                COALESCE(sort_order, 999999),
                created_at DESC
    `).all();

    const assets = (rows.results || []).map((row) => ({
      id: row.id,
      slot: row.slot,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      objectPosition: row.object_position || '',
      altText: row.alt_text || '',
      sortOrder: row.sort_order,
      url: `/api/media/${encodeURIComponent(row.id)}`,
    }));

    return json({ ok: true, assets });
  } catch (error) {
    console.error('PUBLIC_MEDIA_MANIFEST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR', assets: [] }, 500);
  }
}
