const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': status === 200 ? 'public, max-age=30' : 'no-store',
  },
});

const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(context, token, action) {
  const secret = context.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || String(token).length > 2048) return false;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: String(token),
        remoteip: context.request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return Boolean(result.success && (!result.action || result.action === action));
  } catch (error) {
    console.error('TURNSTILE_VERIFY_FAILED', error);
    return false;
  }
}

export async function onRequestGet(context) {
  try {
    const enabled = await context.env.WEDDING_DB.prepare("SELECT value FROM site_settings WHERE key='guestbook_enabled'").first();
    if (enabled?.value === 'false') return json({ ok: true, items: [], enabled: false });
    const url = new URL(context.request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50);
    const rows = await context.env.WEDDING_DB.prepare(`
      SELECT id, name, side, message, created_at
      FROM guestbook
      WHERE visible = 1 AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();
    return json({ ok: true, items: rows.results ?? [], enabled: true });
  } catch (error) {
    console.error('GUESTBOOK_LIST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const name = cleanText(body.name, 30);
    const side = cleanText(body.side, 10).toUpperCase() || null;
    const message = cleanText(body.message, 300);
    const deletePassword = String(body.deletePassword ?? '');

    if (!name) return json({ ok: false, error: 'NAME_REQUIRED' }, 400);
    if (side && !['GROOM', 'BRIDE'].includes(side)) return json({ ok: false, error: 'INVALID_SIDE' }, 400);
    if (!message) return json({ ok: false, error: 'MESSAGE_REQUIRED' }, 400);
    if (deletePassword.length < 4 || deletePassword.length > 30) return json({ ok: false, error: 'INVALID_DELETE_PASSWORD' }, 400);

    const settings = await context.env.WEDDING_DB.prepare(`
      SELECT key, value FROM site_settings
      WHERE key IN ('guestbook_enabled', 'guestbook_write_enabled')
    `).all();
    const settingMap = Object.fromEntries((settings.results ?? []).map((row) => [row.key, row.value]));
    if (settingMap.guestbook_enabled === 'false' || settingMap.guestbook_write_enabled === 'false') {
      return json({ ok: false, error: 'GUESTBOOK_CLOSED' }, 403);
    }

    const human = await verifyTurnstile(context, body.turnstileToken, 'guestbook');
    if (!human) return json({ ok: false, error: 'TURNSTILE_FAILED' }, 403);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const deleteHash = await sha256(`${id}:${deletePassword}`);
    await context.env.WEDDING_DB.prepare(`
      INSERT INTO guestbook(id, name, side, message, delete_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, side, message, deleteHash, now).run();

    return json({ ok: true, id }, 201);
  } catch (error) {
    console.error('GUESTBOOK_CREATE_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
