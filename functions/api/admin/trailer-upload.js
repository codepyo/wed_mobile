const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

const MAX_TRAILER_BYTES = 1024 * 1024 * 1024;
const CHUNK_BYTES = 16 * 1024 * 1024;
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
]);

function actorFromRequest(request) {
  return request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    'admin';
}

function normalizedExtension(extension) {
  const value = String(extension || '').trim().toLowerCase().replace(/^\./, '');
  return ['mp4', 'm4v', 'mov', 'webm'].includes(value) ? value : '';
}

function normalizedVideoMime(extension, mimeType) {
  const mime = String(mimeType || '').trim().toLowerCase();
  if (ALLOWED_VIDEO_MIME.has(mime)) return mime;
  if (extension === 'mp4' || extension === 'm4v') return 'video/mp4';
  if (extension === 'webm') return 'video/webm';
  if (extension === 'mov') return 'video/quicktime';
  return '';
}

function validateMeta(extension, mimeType, size) {
  const normalizedExt = normalizedExtension(extension);
  const bytes = Number(size);
  const normalizedMime = normalizedVideoMime(normalizedExt, mimeType);
  if (!normalizedExt || !Number.isFinite(bytes) || bytes <= 0) return { error: 'INVALID_FILE' };
  if (bytes > MAX_TRAILER_BYTES) return { error: 'VIDEO_TOO_LARGE' };
  if (!normalizedMime) return { error: 'INVALID_VIDEO_TYPE' };
  return {
    extension: normalizedExt,
    mimeType: normalizedMime,
    size: Math.trunc(bytes),
  };
}

function validateMultipartKey(key) {
  return typeof key === 'string' && key.startsWith('trailer/') && key.length <= 420;
}

function normalizeParts(parts) {
  if (!Array.isArray(parts) || !parts.length || parts.length > 10000) return null;
  const normalized = parts.map((part) => ({
    partNumber: Number(part?.partNumber),
    etag: String(part?.etag || ''),
  }));
  if (normalized.some((part) => !Number.isInteger(part.partNumber) || part.partNumber < 1 || part.partNumber > 10000 || !part.etag)) {
    return null;
  }
  normalized.sort((a, b) => a.partNumber - b.partNumber);
  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized[index].partNumber !== index + 1) return null;
  }
  return normalized;
}

async function abortUpload(bucket, key, uploadId) {
  if (!bucket || !validateMultipartKey(key) || !uploadId) return;
  try {
    await bucket.resumeMultipartUpload(key, uploadId).abort();
  } catch (error) {
    console.warn('TRAILER_MULTIPART_ABORT_FAILED', error);
  }
}

export async function onRequestPost(context) {
  const bucket = context.env.WEDDING_MEDIA;
  if (!bucket) return json({ ok: false, error: 'R2_NOT_CONFIGURED' }, 503);

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  if (action === 'create') {
    try {
      const body = await context.request.json().catch(() => ({}));
      const meta = validateMeta(body.extension, body.mimeType, body.size);
      if (meta.error) return json({ ok: false, error: meta.error }, 400);

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const day = now.slice(0, 10).replaceAll('-', '/');
      const key = `trailer/${day}/${id}.${meta.extension}`;
      const multipart = await bucket.createMultipartUpload(key, {
        httpMetadata: {
          contentType: meta.mimeType,
          contentDisposition: 'inline',
        },
        customMetadata: {
          slot: 'TRAILER',
          assetId: id,
        },
      });

      return json({
        ok: true,
        id,
        key,
        uploadId: multipart.uploadId,
        chunkBytes: CHUNK_BYTES,
        maxBytes: MAX_TRAILER_BYTES,
        mimeType: meta.mimeType,
      }, 201);
    } catch (error) {
      console.error('TRAILER_MULTIPART_CREATE_FAILED', error);
      return json({ ok: false, error: 'UPLOAD_CREATE_FAILED' }, 500);
    }
  }

  if (action === 'complete') {
    let completedKey = '';
    try {
      const db = context.env.WEDDING_DB;
      const body = await context.request.json().catch(() => ({}));
      const id = String(body.id || '').trim();
      const key = String(body.key || '').trim();
      const uploadId = String(body.uploadId || '').trim();
      const meta = validateMeta(body.extension, body.mimeType, body.size);
      const parts = normalizeParts(body.parts);

      if (!id || !validateMultipartKey(key) || !uploadId || meta.error || !parts) {
        return json({ ok: false, error: 'INVALID_COMPLETE_REQUEST' }, 400);
      }

      const expectedParts = Math.ceil(meta.size / CHUNK_BYTES);
      if (parts.length !== expectedParts) {
        return json({ ok: false, error: 'PART_COUNT_MISMATCH' }, 400);
      }

      const multipart = bucket.resumeMultipartUpload(key, uploadId);
      const object = await multipart.complete(parts);
      completedKey = key;

      if (Number(object.size) !== meta.size) {
        await bucket.delete(key).catch(() => {});
        return json({ ok: false, error: 'SIZE_MISMATCH' }, 400);
      }

      const now = new Date().toISOString();
      const actor = actorFromRequest(context.request);
      try {
        await db.batch([
          db.prepare(`
            UPDATE media_assets
               SET active = 0, updated_at = ?
             WHERE slot = 'TRAILER' AND active = 1
          `).bind(now),
          db.prepare(`
            INSERT INTO media_assets(
              id, slot, object_key, mime_type, size_bytes, width, height,
              object_position, alt_text, sort_order, active, created_at, updated_at
            ) VALUES (?, 'TRAILER', ?, ?, ?, NULL, NULL, NULL, ?, NULL, 1, ?, ?)
          `).bind(id, key, meta.mimeType, meta.size, 'Wedding Trailer', now, now),
          db.prepare(`
            INSERT INTO admin_audit_log(id, actor, action, entity_type, entity_id, summary, created_at)
            VALUES (?, ?, 'TRAILER_UPLOAD', 'media_asset', ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            actor,
            id,
            `Wedding Trailer (${meta.size} bytes, multipart ${parts.length} parts)`,
            now,
          ),
        ]);
      } catch (dbError) {
        await bucket.delete(key).catch(() => {});
        throw dbError;
      }

      return json({
        ok: true,
        id,
        slot: 'TRAILER',
        sizeBytes: meta.size,
        mimeType: meta.mimeType,
      }, 201);
    } catch (error) {
      if (completedKey) await bucket.delete(completedKey).catch(() => {});
      console.error('TRAILER_MULTIPART_COMPLETE_FAILED', error);
      return json({ ok: false, error: 'UPLOAD_COMPLETE_FAILED' }, 500);
    }
  }

  return json({ ok: false, error: 'INVALID_ACTION' }, 400);
}

export async function onRequestPut(context) {
  const bucket = context.env.WEDDING_MEDIA;
  if (!bucket) return json({ ok: false, error: 'R2_NOT_CONFIGURED' }, 503);

  const url = new URL(context.request.url);
  if (url.searchParams.get('action') !== 'part') {
    return json({ ok: false, error: 'INVALID_ACTION' }, 400);
  }

  const key = String(url.searchParams.get('key') || '');
  const uploadId = String(url.searchParams.get('uploadId') || '');
  const partNumber = Number(url.searchParams.get('partNumber'));

  if (!validateMultipartKey(key) || !uploadId || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
    return json({ ok: false, error: 'INVALID_PART_REQUEST' }, 400);
  }
  if (!context.request.body) return json({ ok: false, error: 'MISSING_PART_BODY' }, 400);

  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > CHUNK_BYTES) return json({ ok: false, error: 'PART_TOO_LARGE' }, 413);

  try {
    const multipart = bucket.resumeMultipartUpload(key, uploadId);
    const uploadedPart = await multipart.uploadPart(partNumber, context.request.body);
    return json({ ok: true, partNumber: uploadedPart.partNumber, etag: uploadedPart.etag });
  } catch (error) {
    console.error('TRAILER_MULTIPART_PART_FAILED', { key, partNumber, error });
    return json({ ok: false, error: 'PART_UPLOAD_FAILED' }, 500);
  }
}

export async function onRequestDelete(context) {
  const bucket = context.env.WEDDING_MEDIA;
  if (!bucket) return json({ ok: false, error: 'R2_NOT_CONFIGURED' }, 503);

  const url = new URL(context.request.url);
  const key = String(url.searchParams.get('key') || '');
  const uploadId = String(url.searchParams.get('uploadId') || '');

  if (!validateMultipartKey(key) || !uploadId) {
    return json({ ok: false, error: 'INVALID_ABORT_REQUEST' }, 400);
  }

  await abortUpload(bucket, key, uploadId);
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store, private' },
  });
}
