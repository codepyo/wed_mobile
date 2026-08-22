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
    const visibility = cleanText(url.searchParams.get('visibility'), 10).toUpperCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 200, 1), 500);

    const where = ["status='ACTIVE'"];
    const binds = [];
    if (q) {
      where.push('(name LIKE ? OR message LIKE ?)');
      binds.push(`%${q}%`, `%${q}%`);
    }
    if (visibility === 'VISIBLE') where.push('visible=1');
    if (visibility === 'HIDDEN') where.push('visible=0');

    const rows = await context.env.WEDDING_DB.prepare(`
      SELECT id, name, side, message, visible, created_at
      FROM guestbook
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(...binds, limit).all();

    return json({ ok: true, items: rows.results ?? [] });
  } catch (error) {
    console.error('ADMIN_GUESTBOOK_LIST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const id = cleanText(body.id, 80);
    const action = cleanText(body.action, 30).toUpperCase();
    if (!id) return json({ ok: false, error: 'ID_REQUIRED' }, 400);
    if (!['HIDE', 'SHOW', 'DELETE'].includes(action)) return json({ ok: false, error: 'INVALID_ACTION' }, 400);

    const now = new Date().toISOString();
    let result;
    if (action === 'HIDE') {
      result = await context.env.WEDDING_DB.prepare('UPDATE guestbook SET visible=0, updated_at=? WHERE id=? AND status=\'ACTIVE\'').bind(now, id).run();
    } else if (action === 'SHOW') {
      result = await context.env.WEDDING_DB.prepare('UPDATE guestbook SET visible=1, updated_at=? WHERE id=? AND status=\'ACTIVE\'').bind(now, id).run();
    } else {
      result = await context.env.WEDDING_DB.prepare("UPDATE guestbook SET status='DELETED', visible=0, deleted_at=?, updated_at=? WHERE id=? AND status='ACTIVE'").bind(now, now, id).run();
    }

    if (!result.meta?.changes) return json({ ok: false, error: 'NOT_FOUND' }, 404);

    const summary = action === 'HIDE' ? '방명록 숨김' : action === 'SHOW' ? '방명록 공개' : '방명록 삭제';
    await context.env.WEDDING_DB.prepare(`
      INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
      VALUES (?, ?, ?, 'GUESTBOOK', ?, ?, ?)
    `).bind(crypto.randomUUID(), context.request.headers.get('Cf-Access-Authenticated-User-Email') || null, `GUESTBOOK_${action}`, id, summary, now).run();

    return json({ ok: true });
  } catch (error) {
    console.error('ADMIN_GUESTBOOK_ACTION_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
