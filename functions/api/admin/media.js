const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const IMAGE_SLOTS = new Set(['HERO', 'GALLERY', 'OG', 'EVENT_SECRET']);
const MULTI_IMAGE_SLOTS = new Set(['GALLERY', 'EVENT_SECRET']);
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

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

async function imageDimensions(file) {
  if (!IMAGE_MIME.has(file.type)) return { width: null, height: null };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    if (file.type === 'image/png' && bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
    }

    if (file.type === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
      while (offset + 4 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
        if (offset >= bytes.length) break;
        const marker = bytes[offset++];
        if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) continue;
        if (offset + 2 > bytes.length) break;
        const length = view.getUint16(offset, false);
        if (length < 2 || offset + length > bytes.length) break;
        if (sofMarkers.has(marker) && length >= 7) {
          return { width: view.getUint16(offset + 5, false), height: view.getUint16(offset + 3, false) };
        }
        offset += length;
      }
    }

    if (file.type === 'image/webp' && bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
      const chunk = String.fromCharCode(...bytes.slice(12, 16));
      if (chunk === 'VP8X' && bytes.length >= 30) {
        return { width: readUint24LE(bytes, 24) + 1, height: readUint24LE(bytes, 27) + 1 };
      }
    }
  } catch (error) {
    console.warn('MEDIA_DIMENSION_READ_FAILED', error);
  }

  return { width: null, height: null };
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

    const { width, height } = IMAGE_SLOTS.has(slot) ? await imageDimensions(file) : { width: null, height: null };
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
      if (!MULTI_IMAGE_SLOTS.has(slot)) {
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        id, slot, objectKey, file.type, file.size, width, height,
        objectPosition || null, altText || null,
        MULTI_IMAGE_SLOTS.has(slot) ? (sortOrder ?? 0) : null,
        now, now,
      ));

      statements.push(db.prepare(`
        INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
        VALUES (?, ?, 'MEDIA_UPLOAD', 'media_asset', ?, ?, ?)
      `).bind(
        crypto.randomUUID(), actorFromRequest(context.request), id,
        `${slot} ${file.name} (${file.size} bytes${width && height ? `, ${width}x${height}` : ''})`, now,
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
