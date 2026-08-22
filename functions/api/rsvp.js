const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  },
});

const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);

async function verifyTurnstile(context, token, action) {
  const secret = context.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || String(token).length > 2048) return false;

  const form = new URLSearchParams({
    secret,
    response: String(token),
    remoteip: context.request.headers.get('CF-Connecting-IP') || '',
  });

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!response.ok) return false;
    const result = await response.json();
    if (!result.success) return false;
    if (result.action && result.action !== action) return false;
    return true;
  } catch (error) {
    console.error('TURNSTILE_VERIFY_FAILED', error);
    return false;
  }
}

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

    const settings = await context.env.WEDDING_DB.prepare(`
      SELECT key, value FROM site_settings WHERE key IN ('rsvp_enabled', 'rsvp_deadline')
    `).all();
    const map = Object.fromEntries((settings.results ?? []).map((row) => [row.key, row.value]));
    if (map.rsvp_enabled === 'false') return json({ ok: false, error: 'RSVP_CLOSED' }, 403);
    if (map.rsvp_deadline) {
      const deadline = Date.parse(map.rsvp_deadline);
      if (Number.isFinite(deadline) && Date.now() > deadline) return json({ ok: false, error: 'RSVP_DEADLINE_PASSED' }, 403);
    }

    const human = await verifyTurnstile(context, body.turnstileToken, 'rsvp');
    if (!human) return json({ ok: false, error: 'TURNSTILE_FAILED' }, 403);

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
