const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const CONTACT_DEFS = [
  { id: 'groom', label: '신랑', name: '승표' },
  { id: 'bride', label: '신부', name: '제희' },
  { id: 'groom-father', label: '신랑 아버지', name: '홍상민' },
  { id: 'groom-mother', label: '신랑 어머니', name: '정미경' },
  { id: 'bride-father', label: '신부 아버지', name: '이현규' },
  { id: 'bride-mother', label: '신부 어머니', name: '장대선' },
];

const ACCOUNT_DEFS = {
  groom: [
    { id: 'groom', label: '신랑' },
    { id: 'groom-father', label: '신랑 아버지' },
    { id: 'groom-mother', label: '신랑 어머니' },
  ],
  bride: [
    { id: 'bride', label: '신부' },
    { id: 'bride-father', label: '신부 아버지' },
    { id: 'bride-mother', label: '신부 어머니' },
  ],
};

const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const toBool = (value) => value === true || value === 'true';

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeContacts(input) {
  const rows = Array.isArray(input) ? input : [];
  return CONTACT_DEFS.map((definition) => {
    const source = rows.find((item) => item && item.id === definition.id) || {};
    return { ...definition, phone: clean(source.phone, 40) };
  });
}

function normalizeAccountGroup(input, side) {
  const rows = Array.isArray(input) ? input : [];
  return ACCOUNT_DEFS[side].map((definition) => {
    const source = rows.find((item) => item && item.id === definition.id) || {};
    return {
      ...definition,
      bank: clean(source.bank, 40),
      accountNumber: clean(source.accountNumber, 80),
      holder: clean(source.holder, 40),
    };
  });
}

function normalizeAccounts(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return {
    groom: normalizeAccountGroup(source.groom, 'groom'),
    bride: normalizeAccountGroup(source.bride, 'bride'),
  };
}

function actorFromRequest(request) {
  return request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    'admin';
}

async function readContent(db) {
  const rows = await db.prepare(`
    SELECT key, value
      FROM site_settings
     WHERE key IN ('contacts_enabled','accounts_enabled','contacts_json','accounts_json')
  `).all();
  const settings = Object.fromEntries((rows.results || []).map((row) => [row.key, row.value ?? '']));

  return {
    contactsEnabled: toBool(settings.contacts_enabled),
    accountsEnabled: toBool(settings.accounts_enabled),
    contacts: normalizeContacts(parseJson(settings.contacts_json, [])),
    accounts: normalizeAccounts(parseJson(settings.accounts_json, {})),
  };
}

export async function onRequestGet(context) {
  try {
    return json({ ok: true, ...(await readContent(context.env.WEDDING_DB)) });
  } catch (error) {
    console.error('ADMIN_CONTENT_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.WEDDING_DB;
    const body = await context.request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ ok: false, error: 'INVALID_PAYLOAD' }, 400);
    }

    const contactsEnabled = toBool(body.contactsEnabled);
    const accountsEnabled = toBool(body.accountsEnabled);
    const contacts = normalizeContacts(body.contacts);
    const accounts = normalizeAccounts(body.accounts);
    const now = new Date().toISOString();

    const values = [
      ['contacts_enabled', contactsEnabled ? 'true' : 'false'],
      ['accounts_enabled', accountsEnabled ? 'true' : 'false'],
      ['contacts_json', JSON.stringify(contacts)],
      ['accounts_json', JSON.stringify(accounts)],
    ];

    const statements = values.map(([key, value]) => db.prepare(`
      INSERT INTO site_settings(key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
    `).bind(key, value, now));

    const contactCount = contacts.filter((item) => item.phone).length;
    const accountCount = [...accounts.groom, ...accounts.bride].filter((item) => item.accountNumber).length;
    statements.push(db.prepare(`
      INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
      VALUES (?, ?, 'CONTENT_UPDATE', 'site_content', NULL, ?, ?)
    `).bind(
      crypto.randomUUID(),
      actorFromRequest(context.request),
      `연락처 ${contactCount}건 / 계좌 ${accountCount}건 / 연락처 공개 ${contactsEnabled ? 'ON' : 'OFF'} / 계좌 공개 ${accountsEnabled ? 'ON' : 'OFF'}`,
      now,
    ));

    await db.batch(statements);
    return json({ ok: true, ...(await readContent(db)) });
  } catch (error) {
    console.error('ADMIN_CONTENT_POST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
