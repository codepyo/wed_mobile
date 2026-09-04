import { useEffect, useMemo, useState } from 'react';
import { wedding } from '../data/wedding';

export type WeddingPhase = 'BEFORE' | 'WEDDING_DAY' | 'AFTER';
export type EventSide = 'GROOM' | 'BRIDE';

export type LocalEventState = {
  version: 1;
  nickname: string;
  side: EventSide;
  cheerCount: number;
  passportSeen: boolean;
  scratchDone: boolean;
  fortuneIndex: number | null;
  photoPassDone: boolean;
  secretUnlocked: boolean;
};

const EVENT_DAY_KEY = `${wedding.ceremony.year}-${String(wedding.ceremony.month).padStart(2, '0')}-${String(wedding.ceremony.day).padStart(2, '0')}`;
const EVENT_STORAGE_KEY = 'wedding-event-local-v1';
const SEOUL_TIME_ZONE = 'Asia/Seoul';

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
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 30_000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, []);

  return useMemo(() => {
    const phase = getWeddingPhase(now);
    const ceremonyStarted = now.getTime() >= Date.parse(wedding.ceremony.isoDate);
    const preview = isLocalEventPreview();
    return {
      now,
      phase,
      preview,
      canEnterEvent: phase === 'WEDDING_DAY' || preview,
      dday: getDdayLabel(now),
      momentText: phase === 'WEDDING_DAY' && ceremonyStarted ? "WE'RE GETTING MARRIED" : getDdayLabel(now),
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
    version: 1,
    nickname: cleanNickname(nickname),
    side,
    cheerCount: 0,
    passportSeen: false,
    scratchDone: false,
    fortuneIndex: null,
    photoPassDone: false,
    secretUnlocked: false,
  };
}

export function loadLocalEventState(): LocalEventState | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENT_STORAGE_KEY) || 'null');
    const nickname = cleanNickname(parsed?.nickname);
    if (!parsed || parsed.version !== 1 || !nickname || !isSide(parsed.side)) return null;
    return {
      version: 1,
      nickname,
      side: parsed.side,
      cheerCount: Math.max(0, Math.floor(Number(parsed.cheerCount) || 0)),
      passportSeen: Boolean(parsed.passportSeen),
      scratchDone: Boolean(parsed.scratchDone),
      fortuneIndex: Number.isInteger(parsed.fortuneIndex) && parsed.fortuneIndex >= 0 ? parsed.fortuneIndex : null,
      photoPassDone: Boolean(parsed.photoPassDone),
      secretUnlocked: Boolean(parsed.secretUnlocked),
    };
  } catch {
    return null;
  }
}

export function saveLocalEventState(state: LocalEventState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(state));
}

export function clearLocalEventState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(EVENT_STORAGE_KEY);
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
  return Math.abs(hash >>> 0) % length;
}
