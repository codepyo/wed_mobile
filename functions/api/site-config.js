const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': status === 200 ? 'public, max-age=30' : 'no-store',
  },
});

const toBool = (value, fallback) => {
  if (value == null) return fallback;
  return String(value).toLowerCase() === 'true';
};

export async function onRequestGet(context) {
  try {
    const result = await context.env.WEDDING_DB.prepare(`
      SELECT key, value
      FROM site_settings
      WHERE key IN ('rsvp_enabled', 'rsvp_deadline', 'guestbook_enabled', 'guestbook_write_enabled', 'music_enabled')
    `).all();

    const settings = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    return json({
      ok: true,
      rsvpEnabled: toBool(settings.rsvp_enabled, true),
      rsvpDeadline: settings.rsvp_deadline || '',
      guestbookEnabled: toBool(settings.guestbook_enabled, true),
      guestbookWriteEnabled: toBool(settings.guestbook_write_enabled, true),
      musicEnabled: toBool(settings.music_enabled, false),
      turnstileEnabled: Boolean(context.env.TURNSTILE_SECRET_KEY),
    });
  } catch (error) {
    console.error('SITE_CONFIG_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
