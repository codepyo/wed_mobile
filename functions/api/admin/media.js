const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const IMAGE_SLOTS = new Set(['HERO', 'GALLERY', 'OG']);
const AUDIO_SLOTS = new Set(['BGM']);
const ALLOWED_SLOTS = new Set([...IMAGE_SLOTS, ...AUDIO_SLOTS]);
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const AUDIO_MIME = new Set(['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function actorFromRequest(request) {
  return request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    'admin';
}

function safeName(name) {
  return String(name || 'asset')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

function validateFile(slot, file) {
  if (!ALLOWED_SLOTS.has(slot)) return 'INVALID_SLOT';
  if (!(file instanceof File) || file.size <= 0) return 'INVALID_FILE';

  if (IMAGE_SLOTS.has(slot)) {
    if (!IMAGE_MIME.has(file.type)) return 'INVALID_IMAGE_TYPE';
    if (file.size > MAX_IMAGE_BYTES) return 'IMAGE_TOO_LARGE';
  }

  if (AUDIO_SLOTS.has(slot)) {
    if (!AUDIO_MIME.has(file.type)) return 'INVALID_AUDIO_TYPE';
    if (file.size > MAX_AUDIO_BYTES) return 'AUDIO_TOO_LARGE';
  }

  return '';
}

async function readAssets(db) {
  const rows = await db.prepare(`
    SELECT id, slot, object_key, mime_type, size_bytes, width, height,
           object_position, alt_text, sort_order, active, created_at, updated_at
      FROM media_assets
     ORDER BY slot, active DESC, COALESCE(sort_order, 999999), created_at DESC
  `).all();
  return rows.results || [];
}

export async function onRequestGet(context) {
  try {
    const assets = await readAssets(context.env.WEDDING_DB);
    return json({
      ok: true,
      bucketConfigured: Boolean(context.env.WEDDING_MEDIA),
      limits: { imageBytes: MAX_IMAGE_BYTES, audioBytes: MAX_AUDIO_BYTES },
      assets,
    });
  } catch (error) {
    console.error('ADMIN_MEDIA_GET_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.WEDDING_DB;
    const bucket = context.env.WEDDING_MEDIA;
    if (!bucket) return json({ ok: false, error: 'R2_NOT_CONFIGURED' }, 503);

    const contentType = context.request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ ok: false, error: 'MULTIPART_REQUIRED' }, 400);
    }

    const form = await context.request.formData();
    const slot = String(form.get('slot') || '').trim().toUpperCase();
    const file = form.get('file');
    const altText = String(form.get('altText') || '').trim().slice(0, 300);
    const objectPosition = String(form.get('objectPosition') || '').trim().slice(0, 50);
    const sortOrderRaw = String(form.get('sortOrder') || '').trim();
    const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : null;

    const validationError = validateFile(slot, file);
    if (validationError) return json({ ok: false, error: validationError }, 400);
    if (sortOrder !== null && (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999)) {
      return json({ ok: false, error: 'INVALID_SORT_ORDER' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const day = now.slice(0, 10).replaceAll('-', '/');
    const objectKey = `${slot.toLowerCase()}/${day}/${id}-${safeName(file.name)}`;

    await bucket.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { slot, originalName: file.name },
    });

    try {
      const statements = [];
      if (slot !== 'GALLERY') {
        statements.push(db.prepare(`
          UPDATE media_assets
             SET active = 0, updated_at = ?
           WHERE slot = ? AND active = 1
        `).bind(now, slot));
      }

      statements.push(db.prepare(`
        INSERT INTO media_assets(
          id, slot, object_key, mime_type, size_bytes, width, height,
          object_position, alt_text, sort_order, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, 1, ?, ?)
      `).bind(
        id, slot, objectKey, file.type, file.size,
        objectPosition || null, altText || null,
        slot === 'GALLERY' ? (sortOrder ?? 0) : null,
        now, now,
      ));

      statements.push(db.prepare(`
        INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
        VALUES (?, ?, 'MEDIA_UPLOAD', 'media_asset', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), actorFromRequest(context.request), id,
        `${slot} ${file.name} (${file.size} bytes)`, now,
      ));

      await db.batch(statements);
    } catch (dbError) {
      await bucket.delete(objectKey).catch(() => {});
      throw dbError;
    }

    return json({ ok: true, id, slot, objectKey, assets: await readAssets(db) }, 201);
  } catch (error) {
    console.error('ADMIN_MEDIA_POST_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
