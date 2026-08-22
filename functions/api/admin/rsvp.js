const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const q = cleanText(url.searchParams.get('q'), 80);
    const side = cleanText(url.searchParams.get('side'), 10).toUpperCase();
    const attendance = cleanText(url.searchParams.get('attendance'), 10).toUpperCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 200, 1), 500);

    const where = ["status='ACTIVE'"];
    const binds = [];
    if (q) {
      where.push('(name LIKE ? OR COALESCE(message, \'\') LIKE ?)');
      binds.push(`%${q}%`, `%${q}%`);
    }
    if (['GROOM', 'BRIDE'].includes(side)) {
      where.push('side=?');
      binds.push(side);
    }
    if (['YES', 'NO'].includes(attendance)) {
      where.push('attendance=?');
      binds.push(attendance);
    }

    const rows = await context.env.WEDDING_DB.prepare(`
      SELECT id, name, side, attendance, guest_count, meal, message, created_at
      FROM rsvp
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(...binds, limit).all();

    return json({ ok: true, items: rows.results ?? [] });
  } catch (error) {
    console.error('ADMIN_RSVP_LIST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const id = cleanText(body.id, 80);
    const action = cleanText(body.action, 30).toUpperCase();
    if (!id) return json({ ok: false, error: 'ID_REQUIRED' }, 400);
    if (action !== 'DELETE') return json({ ok: false, error: 'INVALID_ACTION' }, 400);

    const now = new Date().toISOString();
    const result = await context.env.WEDDING_DB.prepare(`
      UPDATE rsvp
      SET status='DELETED', deleted_at=?, updated_at=?
      WHERE id=? AND status='ACTIVE'
    `).bind(now, now, id).run();

    if (!result.meta?.changes) return json({ ok: false, error: 'NOT_FOUND' }, 404);

    await context.env.WEDDING_DB.prepare(`
      INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
      VALUES (?, ?, 'RSVP_DELETE', 'RSVP', ?, ?, ?)
    `).bind(crypto.randomUUID(), context.request.headers.get('Cf-Access-Authenticated-User-Email') || null, id, 'RSVP 응답 삭제', now).run();

    return json({ ok: true });
  } catch (error) {
    console.error('ADMIN_RSVP_ACTION_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
