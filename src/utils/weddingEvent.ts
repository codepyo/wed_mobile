import { useEffect, useMemo, useState } from 'react';
import { wedding } from '../data/wedding';

export type WeddingPhase = 'BEFORE' | 'WEDDING_DAY' | 'AFTER';
export type EventSide = 'GROOM' | 'BRIDE';

export type LocalEventState = {
  version: 2;
  nickname: string;
  side: EventSide;
  cheerCount: number;
  serverSessionId: string;
  serverSyncedCheerCount: number;
  globalCheerCount: number;
  pendingCheerBatchId: string;
  pendingCheerBatchDelta: number;
  passportSeen: boolean;
  scratchDone: boolean;
  fortuneIndex: number | null;
  rollingPaperDone: boolean;
  photoPassDone: boolean;
  secretUnlocked: boolean;
};

const EVENT_DAY_KEY = `${wedding.ceremony.year}-${String(wedding.ceremony.month).padStart(2, '0')}-${String(wedding.ceremony.day).padStart(2, '0')}`;
const EVENT_STORAGE_KEY = 'wedding-event-local-v1';
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const CEREMONY_TIME = Date.parse(wedding.ceremony.isoDate);

const seoulFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SEOUL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function seoulParts(date: Date) {
  const parts = Object.fromEntries(seoulFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function getSeoulDateKey(date = new Date()) {
  const { year, month, day } = seoulParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getWeddingPhase(date = new Date()): WeddingPhase {
  const key = getSeoulDateKey(date);
  if (key < EVENT_DAY_KEY) return 'BEFORE';
  if (key === EVENT_DAY_KEY) return 'WEDDING_DAY';
  return 'AFTER';
}

export function getDdayLabel(date = new Date()) {
  const currentParts = seoulParts(date);
  const current = Date.UTC(currentParts.year, currentParts.month - 1, currentParts.day);
  const target = Date.UTC(wedding.ceremony.year, wedding.ceremony.month - 1, wedding.ceremony.day);
  const diff = Math.round((target - current) / 86_400_000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-DAY';
  return `D+${Math.abs(diff)}`;
}

export function isLocalEventPreview() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  return local && new URLSearchParams(window.location.search).get('eventPreview') === '1';
}

export function useWeddingClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const current = Date.now();
      const untilCeremony = CEREMONY_TIME - current;
      const delay = untilCeremony > 0 ? Math.min(30_000, Math.max(100, untilCeremony + 20)) : 30_000;
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, delay);
    };

    const update = () => setNow(new Date());
    schedule();
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, []);

  return useMemo(() => {
    const phase = getWeddingPhase(now);
    const ceremonyStarted = now.getTime() >= CEREMONY_TIME;
    const preview = isLocalEventPreview();
    const dday = getDdayLabel(now);
    return {
      now,
      phase,
      preview,
      canEnterEvent: phase === 'WEDDING_DAY' || preview,
      dday,
      momentText: phase === 'WEDDING_DAY' && ceremonyStarted ? "WE'RE GETTING MARRIED" : dday,
      ceremonyStarted,
    };
  }, [now]);
}

function cleanNickname(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function isSide(value: unknown): value is EventSide {
  return value === 'GROOM' || value === 'BRIDE';
}

export function createLocalEventState(nickname: string, side: EventSide): LocalEventState {
  return {
    version: 2,
    nickname: cleanNickname(nickname),
    side,
    cheerCount: 0,
    serverSessionId: '',
    serverSyncedCheerCount: 0,
    globalCheerCount: 0,
    pendingCheerBatchId: '',
    pendingCheerBatchDelta: 0,
    passportSeen: false,
    scratchDone: false,
    fortuneIndex: null,
    rollingPaperDone: false,
    photoPassDone: false,
    secretUnlocked: false,
  };
}

export function loadLocalEventState(): LocalEventState | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENT_STORAGE_KEY) || 'null');
    const nickname = cleanNickname(parsed?.nickname);
    if (!parsed || ![1, 2].includes(Number(parsed.version)) || !nickname || !isSide(parsed.side)) return null;
    const cheerCount = Math.max(0, Math.floor(Number(parsed.cheerCount) || 0));
    const synced = Math.max(0, Math.floor(Number(parsed.serverSyncedCheerCount) || 0));
    const pendingDelta = Math.max(0, Math.min(200, Math.floor(Number(parsed.pendingCheerBatchDelta) || 0)));
    return {
      version: 2,
      nickname,
      side: parsed.side,
      cheerCount,
      serverSessionId: String(parsed.serverSessionId || '').slice(0, 80),
      serverSyncedCheerCount: Math.min(cheerCount, synced),
      globalCheerCount: Math.max(0, Math.floor(Number(parsed.globalCheerCount) || 0)),
      pendingCheerBatchId: String(parsed.pendingCheerBatchId || '').slice(0, 80),
      pendingCheerBatchDelta: pendingDelta,
      passportSeen: Boolean(parsed.passportSeen),
      scratchDone: Boolean(parsed.scratchDone),
      fortuneIndex: Number.isInteger(parsed.fortuneIndex) && parsed.fortuneIndex >= 0 ? parsed.fortuneIndex : null,
      rollingPaperDone: Boolean(parsed.rollingPaperDone),
      photoPassDone: Boolean(parsed.photoPassDone),
      secretUnlocked: Boolean(parsed.secretUnlocked || cheerCount >= 5),
    };
  } catch {
    return null;
  }
}

export function saveLocalEventState(state: LocalEventState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Event interaction still works in-memory when storage is unavailable.
  }
}

export function sideLabel(side: EventSide) {
  return side === 'GROOM' ? '신랑측' : '신부측';
}

export function deterministicIndex(seed: string, length: number) {
  if (length <= 1) return 0;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}
