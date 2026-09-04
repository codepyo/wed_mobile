import type { EventSide } from './weddingEvent';

export type EventStroke = {
  color: string;
  width: 3 | 6 | 10;
  points: Array<[number, number]>;
};

export type EventDrawing = {
  id: string;
  nickname: string;
  side: EventSide;
  caption: string;
  strokes: EventStroke[];
  createdAt: string;
};

export type EventSessionPayload = {
  sessionId: string;
  nickname: string;
  side: EventSide;
  personalCheer: number;
  globalCheer: number;
  enteredAt: string;
};

export type EventSecretAsset = {
  id: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  objectPosition?: string;
  altText?: string;
  sortOrder?: number | null;
  url: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.error || 'REQUEST_FAILED'));
  return data as T;
}

export async function syncEventSession(input: { nickname: string; side: EventSide; sessionId?: string }) {
  return requestJson<EventSessionPayload & { ok: true }>('/api/event/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(input),
  });
}

export async function flushEventCheer(sessionId: string, batchId: string, delta: number) {
  return requestJson<{ ok: true; batchId: string; personalCheer: number; globalCheer: number; flushed: number; duplicate?: boolean }>('/api/event/cheer', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ sessionId, batchId, delta }),
  });
}

export async function fetchEventDrawings(sessionId?: string) {
  const params = new URLSearchParams();
  if (sessionId) params.set('sessionId', sessionId);
  const suffix = params.size ? `?${params}` : '';
  return requestJson<{ ok: true; drawings: EventDrawing[]; globalCheer: number; personalCheer: number }>(`/api/event/drawings${suffix}`);
}

export async function postEventDrawing(input: { sessionId: string; strokes: EventStroke[]; caption: string }) {
  return requestJson<{ ok: true; drawing: EventDrawing; remaining: number }>('/api/event/drawings', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(input),
  });
}

export async function fetchEventSecret(sessionId: string) {
  const params = new URLSearchParams({ sessionId });
  return requestJson<{ ok: true; unlocked: true; assets: EventSecretAsset[] }>(`/api/event/secret?${params}`);
}
