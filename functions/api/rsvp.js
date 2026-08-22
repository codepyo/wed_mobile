const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const name = cleanText(body.name, 30);
    const side = cleanText(body.side, 10).toUpperCase();
    const attendance = cleanText(body.attendance, 10).toUpperCase();
    const meal = cleanText(body.meal, 10).toUpperCase() || null;
    const message = cleanText(body.message, 500) || null;
    const guestCount = attendance === 'YES' ? Number(body.guestCount) : null;

    if (!name) return json({ ok: false, error: 'NAME_REQUIRED' }, 400);
    if (!['GROOM', 'BRIDE'].includes(side)) return json({ ok: false, error: 'INVALID_SIDE' }, 400);
    if (!['YES', 'NO'].includes(attendance)) return json({ ok: false, error: 'INVALID_ATTENDANCE' }, 400);
    if (meal && !['YES', 'NO', 'UNKNOWN'].includes(meal)) return json({ ok: false, error: 'INVALID_MEAL' }, 400);
    if (attendance === 'YES' && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
      return json({ ok: false, error: 'INVALID_GUEST_COUNT' }, 400);
    }

    const enabled = await context.env.WEDDING_DB.prepare("SELECT value FROM site_settings WHERE key='rsvp_enabled'").first();
    if (enabled?.value === 'false') return json({ ok: false, error: 'RSVP_CLOSED' }, 403);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await context.env.WEDDING_DB.prepare(`
      INSERT INTO rsvp(id, name, side, attendance, guest_count, meal, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, side, attendance, guestCount, meal, message, now).run();

    return json({ ok: true, id }, 201);
  } catch (error) {
    console.error('RSVP_CREATE_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
