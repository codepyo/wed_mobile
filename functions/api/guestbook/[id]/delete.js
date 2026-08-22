const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const id = String(context.params.id || '').trim();
    const body = await context.request.json();
    const password = String(body.deletePassword ?? '');
    if (!id || password.length < 4 || password.length > 30) return json({ ok: false, error: 'INVALID_REQUEST' }, 400);

    const row = await context.env.WEDDING_DB.prepare(`
      SELECT delete_hash FROM guestbook WHERE id = ? AND status = 'ACTIVE'
    `).bind(id).first();
    if (!row) return json({ ok: false, error: 'NOT_FOUND' }, 404);

    const candidate = await sha256(`${id}:${password}`);
    if (candidate !== row.delete_hash) return json({ ok: false, error: 'INVALID_PASSWORD' }, 403);

    const now = new Date().toISOString();
    await context.env.WEDDING_DB.prepare(`
      UPDATE guestbook SET status = 'DELETED', visible = 0, updated_at = ?, deleted_at = ? WHERE id = ?
    `).bind(now, now, id).run();

    return json({ ok: true });
  } catch (error) {
    console.error('GUESTBOOK_DELETE_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
