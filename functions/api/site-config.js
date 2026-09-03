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

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function publicContacts(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows.slice(0, 10).map((item) => ({
    id: clean(item?.id, 60),
    label: clean(item?.label, 40),
    name: clean(item?.name, 40),
    phone: clean(item?.phone, 40),
  })).filter((item) => item.id && item.name && item.phone);
}

function publicAccountGroup(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows.slice(0, 10).map((item) => ({
    id: clean(item?.id, 60),
    label: clean(item?.label, 40),
    bank: clean(item?.bank, 40),
    accountNumber: clean(item?.accountNumber, 80),
    holder: clean(item?.holder, 40),
  })).filter((item) => item.id && item.accountNumber);
}

function publicAccounts(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    groom: publicAccountGroup(source.groom),
    bride: publicAccountGroup(source.bride),
  };
}

export async function onRequestGet(context) {
  try {
    const result = await context.env.WEDDING_DB.prepare(`
      SELECT key, value
      FROM site_settings
      WHERE key IN (
        'rsvp_enabled', 'rsvp_deadline', 'guestbook_enabled', 'guestbook_write_enabled', 'music_enabled',
        'contacts_enabled', 'accounts_enabled', 'contacts_json', 'accounts_json'
      )
    `).all();

    const settings = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    const contactsEnabled = toBool(settings.contacts_enabled, false);
    const accountsEnabled = toBool(settings.accounts_enabled, false);

    return json({
      ok: true,
      rsvpEnabled: toBool(settings.rsvp_enabled, true),
      rsvpDeadline: settings.rsvp_deadline || '',
      guestbookEnabled: toBool(settings.guestbook_enabled, true),
      guestbookWriteEnabled: toBool(settings.guestbook_write_enabled, true),
      musicEnabled: toBool(settings.music_enabled, false),
      contactsEnabled,
      accountsEnabled,
      contacts: contactsEnabled ? publicContacts(parseJson(settings.contacts_json, [])) : [],
      accounts: accountsEnabled ? publicAccounts(parseJson(settings.accounts_json, {})) : { groom: [], bride: [] },
      turnstileEnabled: Boolean(context.env.TURNSTILE_SECRET_KEY),
    });
  } catch (error) {
    console.error('SITE_CONFIG_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
