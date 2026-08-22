const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const ALLOWED_KEYS = new Set([
  'rsvp_enabled',
  'rsvp_deadline',
  'guestbook_enabled',
  'guestbook_write_enabled',
  'music_enabled',
]);

const BOOLEAN_KEYS = new Set([
  'rsvp_enabled',
  'guestbook_enabled',
  'guestbook_write_enabled',
  'music_enabled',
]);

const DEFAULTS = {
  rsvp_enabled: 'true',
  rsvp_deadline: '',
  guestbook_enabled: 'true',
  guestbook_write_enabled: 'true',
  music_enabled: 'false',
};

function normalizeValue(key, value) {
  if (BOOLEAN_KEYS.has(key)) return value === true || value === 'true' ? 'true' : 'false';
  if (key === 'rsvp_deadline') {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const timestamp = Date.parse(text);
    if (!Number.isFinite(timestamp)) throw new Error('INVALID_RSVP_DEADLINE');
    return new Date(timestamp).toISOString();
  }
  return String(value ?? '');
}

function actorFromRequest(request) {
  return request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    'admin';
}

async function readSettings(db) {
  const rows = await db.prepare(`
    SELECT key, value, updated_at
      FROM site_settings
     WHERE key IN ('rsvp_enabled','rsvp_deadline','guestbook_enabled','guestbook_write_enabled','music_enabled')
  `).all();

  const values = { ...DEFAULTS };
  const updatedAt = {};
  for (const row of rows.results || []) {
    if (!ALLOWED_KEYS.has(row.key)) continue;
    values[row.key] = row.value ?? '';
    updatedAt[row.key] = row.updated_at ?? null;
  }

  return {
    rsvpEnabled: values.rsvp_enabled === 'true',
    rsvpDeadline: values.rsvp_deadline || '',
    guestbookEnabled: values.guestbook_enabled === 'true',
    guestbookWriteEnabled: values.guestbook_write_enabled === 'true',
    musicEnabled: values.music_enabled === 'true',
    updatedAt,
  };
}

export async function onRequestGet(context) {
  try {
    return json({ ok: true, ...(await readSettings(context.env.WEDDING_DB)) });
  } catch (error) {
    console.error('ADMIN_SETTINGS_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.WEDDING_DB;
    const body = await context.request.json();
    const updates = body?.updates;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return json({ ok: false, error: 'INVALID_PAYLOAD' }, 400);
    }

    const entries = Object.entries(updates);
    if (!entries.length || entries.length > ALLOWED_KEYS.size) {
      return json({ ok: false, error: 'INVALID_PAYLOAD' }, 400);
    }

    const normalized = [];
    for (const [key, value] of entries) {
      if (!ALLOWED_KEYS.has(key)) return json({ ok: false, error: 'INVALID_SETTING_KEY' }, 400);
      normalized.push([key, normalizeValue(key, value)]);
    }

    const currentRows = await db.prepare(`
      SELECT key, value FROM site_settings
       WHERE key IN ('rsvp_enabled','rsvp_deadline','guestbook_enabled','guestbook_write_enabled','music_enabled')
    `).all();
    const current = Object.fromEntries((currentRows.results || []).map((row) => [row.key, row.value ?? '']));

    const now = new Date().toISOString();
    const statements = normalized.map(([key, value]) => db.prepare(`
      INSERT INTO site_settings(key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
    `).bind(key, value, now));

    const changed = normalized.filter(([key, value]) => String(current[key] ?? DEFAULTS[key] ?? '') !== value);

    if (changed.length) {
      const actor = actorFromRequest(context.request);
      const summary = changed.map(([key, value]) => `${key}=${value || '(empty)'}`).join(', ');
      statements.push(db.prepare(`
        INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
        VALUES (?, ?, 'SETTINGS_UPDATE', 'site_settings', NULL, ?, ?)
      `).bind(crypto.randomUUID(), actor, summary, now));
    }

    await db.batch(statements);
    return json({ ok: true, ...(await readSettings(db)) });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_RSVP_DEADLINE') {
      return json({ ok: false, error: 'INVALID_RSVP_DEADLINE' }, 400);
    }
    console.error('ADMIN_SETTINGS_POST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
