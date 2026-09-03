const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
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

async function readGuestbookSettings(db) {
  const rows = await db.prepare(`
    SELECT key, value FROM site_settings
    WHERE key IN ('guestbook_enabled', 'guestbook_write_enabled')
  `).all();
  const settings = Object.fromEntries((rows.results ?? []).map((row) => [row.key, row.value]));
  return {
    enabled: settings.guestbook_enabled !== 'false',
    writeEnabled: settings.guestbook_write_enabled !== 'false',
  };
}

export async function onRequestGet(context) {
  try {
    const settings = await readGuestbookSettings(context.env.WEDDING_DB);
    return json({ ok: true, private: true, items: [], ...settings });
  } catch (error) {
    console.error('PRIVATE_LETTER_STATUS_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const name = cleanText(body.name, 30);
    const side = cleanText(body.side, 10).toUpperCase() || null;
    const message = cleanText(body.message, 1000);

    if (!name) return json({ ok: false, error: 'NAME_REQUIRED' }, 400);
    if (side && !['GROOM', 'BRIDE'].includes(side)) return json({ ok: false, error: 'INVALID_SIDE' }, 400);
    if (!message) return json({ ok: false, error: 'MESSAGE_REQUIRED' }, 400);

    const settings = await readGuestbookSettings(context.env.WEDDING_DB);
    if (!settings.enabled || !settings.writeEnabled) {
      return json({ ok: false, error: 'GUESTBOOK_CLOSED' }, 403);
    }

    const human = await verifyTurnstile(context, body.turnstileToken, 'guestbook');
    if (!human) return json({ ok: false, error: 'TURNSTILE_FAILED' }, 403);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const deleteHash = await sha256(`${id}:${crypto.randomUUID()}`);
    await context.env.WEDDING_DB.prepare(`
      INSERT INTO guestbook(id, name, side, message, delete_hash, visible, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(id, name, side, message, deleteHash, now).run();

    return json({ ok: true, id, private: true }, 201);
  } catch (error) {
    console.error('PRIVATE_LETTER_CREATE_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
