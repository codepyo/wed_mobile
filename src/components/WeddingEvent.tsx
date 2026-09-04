import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EventPhotoPass } from './EventPhotoPass';
import { EventRollingPaper } from './EventRollingPaper';
import { EventScratchCard } from './EventScratchCard';
import {
  createLocalEventState,
  deterministicIndex,
  loadLocalEventState,
  saveLocalEventState,
  sideLabel,
  type EventSide,
  type LocalEventState,
  type WeddingPhase,
} from '../utils/weddingEvent';
import {
  fetchEventSecret,
  flushEventCheer,
  syncEventSession,
  type EventSecretAsset,
} from '../utils/weddingEventApi';

const FORTUNES = [
  {
    headline: '웃음이 오래 남는 날',
    body: '오늘 나눈 웃음 하나가 좋은 기억으로 오래 남을 거예요. 두 사람의 시작을 함께 축하해주신 마음만큼, 좋은 일이 곁에 머물기를 바랍니다.',
    lucky: '함께 찍은 한 장의 사진',
  },
  {
    headline: '좋은 인연이 이어지는 날',
    body: '소중한 자리에 와주신 발걸음처럼 따뜻한 인연이 앞으로도 자연스럽게 이어질 거예요. 오늘의 기분 좋은 만남을 오래 간직해 주세요.',
    lucky: '먼저 건네는 반가운 인사',
  },
  {
    headline: '축하가 행운으로 돌아오는 날',
    body: '누군가의 행복을 진심으로 축하한 마음은 언젠가 더 큰 기쁨이 되어 돌아옵니다. 오늘 보내주신 축하만큼 행복한 순간이 많이 찾아오길 바랍니다.',
    lucky: '마음껏 보내는 박수와 축하',
  },
  {
    headline: '사진 속 표정이 가장 좋은 날',
    body: '오늘은 꾸미지 않은 순간이 가장 예쁘게 남는 날입니다. 카메라 앞에서도, 카메라 밖에서도 편안하게 웃는 하루가 되기를 바랍니다.',
    lucky: '예상하지 못한 자연스러운 한 컷',
  },
  {
    headline: '기분 좋은 일이 겹치는 날',
    body: '좋은 자리에 좋은 마음으로 함께한 오늘, 작지만 반가운 일들이 연달아 찾아올 거예요. 돌아가는 길까지 기분 좋은 하루가 되기를 바랍니다.',
    lucky: '우연히 들은 좋아하는 노래',
  },
  {
    headline: '따뜻한 마음을 받는 날',
    body: '오늘 건넨 축하와 다정함이 주변 사람에게도 전해질 거예요. 다정한 마음 하나가 또 다른 따뜻함을 만드는 하루가 되기를 바랍니다.',
    lucky: '고맙다는 짧은 한마디',
  },
];

const SCRATCH_MESSAGES = [
  '오늘의 숨은 행운은 가까운 곳에 있어요. 좋은 사람과 나눈 짧은 대화 하나까지 오래 기억되는 하루가 되길 바랍니다.',
  '호박 아래 숨겨진 메시지처럼, 예상하지 못한 좋은 일이 조용히 찾아오길 바랍니다. 오늘 마음껏 웃고 즐겨주세요.',
  '승표와 제희에게 보내주신 축하만큼 따뜻한 순간이 다시 돌아오길 바랍니다. 오늘의 좋은 기운을 그대로 가져가세요.',
  '오늘 한 장쯤은 꼭 마음에 드는 사진을 남겨보세요. 시간이 지나 다시 봤을 때 지금의 공기까지 떠오르는 사진이 될 거예요.',
  '좋은 날에 함께한 사람에게는 좋은 일이 생긴다는 작은 미신을 믿어봅니다. 오늘의 행운을 편하게 챙겨가세요.',
];

const SECRET_MESSAGES = [
  '다섯 번의 축하를 가장 먼저 통과한 당신에게. 오늘 승표와 제희에게 보낸 좋은 마음이 당신의 다음 좋은 날에도 그대로 돌아오기를.',
  'SECRET OPENED. 축하를 아끼지 않은 만큼 오늘은 평소보다 조금 더 많이 웃고, 조금 더 좋은 기억을 가져가세요.',
  '비밀 문을 열었습니다. 오늘의 미션은 간단해요. 좋아하는 사람들과 사진 한 장, 좋은 말 한마디를 꼭 남겨주세요.',
  '다섯 번이나 눌러준 정성에 작은 비밀을 공개합니다. 오늘의 행운은 멀리 있지 않고, 바로 지금 함께 있는 사람들 사이에 있어요.',
];

type Props = {
  phase: WeddingPhase;
  canEnter: boolean;
  preview?: boolean;
};

type EntryProps = {
  current: LocalEventState | null;
  serverRecording: boolean;
  onSubmit: (nickname: string, side: EventSide) => void;
};

type ServerStatus = 'local' | 'connecting' | 'online' | 'offline';

function EventEntryForm({ current, serverRecording, onSubmit }: EntryProps) {
  const [nickname, setNickname] = useState(current?.nickname || '');
  const [side, setSide] = useState<EventSide | ''>(current?.side || '');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = nickname.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!clean) {
      setError('이벤트에서 사용할 이름이나 닉네임을 적어주세요.');
      return;
    }
    if (!side) {
      setError('신랑측 또는 신부측을 선택해 주세요.');
      return;
    }
    onSubmit(clean, side);
  };

  return (
    <div className="event-entry">
      <p className="event-kicker">TRICK OR WEDDING?</p>
      <h2>오늘의 이름으로<br />파티에 들어오세요.</h2>
      <p className="event-entry__intro">{serverRecording
        ? '닉네임·하객 구분과 EVENT 활동 기록은 당일 운영을 위해 저장됩니다. 사진 원본은 서버로 전송되지 않습니다.'
        : '미리보기 정보와 진행도는 이 브라우저에만 저장됩니다. 사진 원본은 서버로 전송되지 않습니다.'}</p>
      <form onSubmit={submit}>
        <label className="event-field">
          <span>닉네임 또는 이름</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} autoComplete="nickname" placeholder="예: 수원유령 민수" autoFocus />
        </label>
        <fieldset className="event-side-choice">
          <legend>어느 쪽 하객이신가요?</legend>
          <div>
            <label><input type="radio" name="event-side" checked={side === 'GROOM'} onChange={() => setSide('GROOM')} /><span>신랑측</span></label>
            <label><input type="radio" name="event-side" checked={side === 'BRIDE'} onChange={() => setSide('BRIDE')} /><span>신부측</span></label>
          </div>
        </fieldset>
        {error && <p className="event-form-error" role="alert">{error}</p>}
        <button type="submit" className="event-primary-button">ENTER THE PARTY</button>
      </form>
    </div>
  );
}

function PumpkinMark() {
  return <span className="pumpkin-mark" aria-hidden="true"><i /><b /><em /><span /></span>;
}

function completedTaskCount(session: LocalEventState) {
  return [
    session.cheerCount >= 5,
    session.scratchDone,
    session.fortuneIndex !== null,
    session.rollingPaperDone,
    session.photoPassDone,
  ].filter(Boolean).length;
}

function createBatchId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function WeddingEvent({ phase, canEnter, preview = false }: Props) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<LocalEventState | null>(() => loadLocalEventState());
  const [passportOpen, setPassportOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(false);
  const [comboMessage, setComboMessage] = useState('');
  const [cheerPulse, setCheerPulse] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('local');
  const [secretAssets, setSecretAssets] = useState<EventSecretAsset[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const passportRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const comboTimerRef = useRef<number | null>(null);
  const cheerTimerRef = useRef<number | null>(null);
  const cheerInFlightRef = useRef(false);
  const sessionRef = useRef<LocalEventState | null>(session);

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const serverMode = phase === 'WEDDING_DAY' && !preview;

  useEffect(() => { sessionRef.current = session; }, [session]);

  const updateSession = useCallback((updater: (current: LocalEventState) => LocalEventState) => {
    setSession((current) => {
      if (!current) return current;
      const next = updater(current);
      sessionRef.current = next;
      saveLocalEventState(next);
      return next;
    });
  }, []);

  const closeEvent = () => {
    setPassportOpen(false);
    setEditingEntry(false);
    setOpen(false);
  };

  const openEvent = () => {
    if (!canEnter) return;
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const stored = loadLocalEventState();
    setSession(stored);
    sessionRef.current = stored;
    setEditingEntry(false);
    setPassportOpen(Boolean(stored && !stored.passportSeen));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      const root = dialogRef.current;
      const target = root?.querySelector<HTMLElement>('.event-entry input')
        || root?.querySelector<HTMLElement>('.event-pass-trigger')
        || root?.querySelector<HTMLElement>('.event-close');
      target?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      lastFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !passportOpen) return;
    const timer = window.setTimeout(() => {
      passportRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, passportOpen]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (passportOpen) {
          setPassportOpen(false);
          updateSession((current) => ({ ...current, passportSeen: true }));
          window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('.event-pass-trigger')?.focus(), 0);
        } else {
          closeEvent();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const root = passportOpen ? passportRef.current : dialogRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')).filter((item) => item.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, passportOpen, updateSession]);

  useEffect(() => () => {
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    if (cheerTimerRef.current) window.clearTimeout(cheerTimerRef.current);
  }, []);

  useEffect(() => {
    if (!serverMode || !open || !session) {
      setServerStatus(preview ? 'local' : serverMode ? 'connecting' : 'local');
      return;
    }
    let cancelled = false;
    setServerStatus('connecting');
    const snapshot = session;
    void syncEventSession({
      nickname: snapshot.nickname,
      side: snapshot.side,
      sessionId: snapshot.serverSessionId || undefined,
    }).then((payload) => {
      if (cancelled) return;
      updateSession((current) => {
        const confirmed = Math.max(current.serverSyncedCheerCount, payload.personalCheer);
        const locallyUnconfirmed = Math.max(0, current.cheerCount - current.serverSyncedCheerCount);
        const cheerCount = current.pendingCheerBatchId
          ? Math.max(current.cheerCount, confirmed)
          : Math.max(current.cheerCount, confirmed + locallyUnconfirmed);
        return {
          ...current,
          serverSessionId: payload.sessionId,
          serverSyncedCheerCount: confirmed,
          globalCheerCount: Math.max(current.globalCheerCount, payload.globalCheer),
          cheerCount,
          secretUnlocked: current.secretUnlocked || cheerCount >= 5 || confirmed >= 5,
        };
      });
      setServerStatus('online');
    }).catch(() => {
      if (!cancelled) setServerStatus('offline');
    });
    return () => { cancelled = true; };
  }, [serverMode, open, session?.nickname, session?.side, session?.serverSessionId, updateSession, preview]);

  const flushPendingCheer = useCallback(async () => {
    if (!serverMode || cheerInFlightRef.current) return;
    const current = sessionRef.current;
    if (!current?.serverSessionId) return;

    const unsynced = Math.max(0, current.cheerCount - current.serverSyncedCheerCount);
    if (!current.pendingCheerBatchId && unsynced <= 0) return;

    const batchId = current.pendingCheerBatchId || createBatchId();
    const delta = current.pendingCheerBatchId
      ? current.pendingCheerBatchDelta
      : Math.min(200, unsynced);
    if (!delta) return;

    if (!current.pendingCheerBatchId) {
      updateSession((state) => ({ ...state, pendingCheerBatchId: batchId, pendingCheerBatchDelta: delta }));
    }

    cheerInFlightRef.current = true;
    try {
      const payload = await flushEventCheer(current.serverSessionId, batchId, delta);
      updateSession((state) => {
        const matches = state.pendingCheerBatchId === batchId || !state.pendingCheerBatchId;
        return {
          ...state,
          cheerCount: Math.max(state.cheerCount, payload.personalCheer),
          serverSyncedCheerCount: Math.max(state.serverSyncedCheerCount, payload.personalCheer),
          globalCheerCount: Math.max(state.globalCheerCount, payload.globalCheer),
          pendingCheerBatchId: matches ? '' : state.pendingCheerBatchId,
          pendingCheerBatchDelta: matches ? 0 : state.pendingCheerBatchDelta,
          secretUnlocked: state.secretUnlocked || payload.personalCheer >= 5,
        };
      });
      setServerStatus('online');
    } catch {
      setServerStatus('offline');
    } finally {
      cheerInFlightRef.current = false;
    }
  }, [serverMode, updateSession]);

  useEffect(() => {
    if (!serverMode || !session?.serverSessionId) return;
    const unsynced = Math.max(0, session.cheerCount - session.serverSyncedCheerCount);
    if (!session.pendingCheerBatchId && unsynced <= 0) return;
    if (cheerTimerRef.current) window.clearTimeout(cheerTimerRef.current);
    cheerTimerRef.current = window.setTimeout(() => void flushPendingCheer(), 500);
    return () => {
      if (cheerTimerRef.current) window.clearTimeout(cheerTimerRef.current);
    };
  }, [serverMode, session?.serverSessionId, session?.cheerCount, session?.serverSyncedCheerCount, session?.pendingCheerBatchId, flushPendingCheer]);

  useEffect(() => {
    if (!serverMode) return;
    const flushIfLeaving = () => {
      if (document.visibilityState === 'hidden') void flushPendingCheer();
    };
    document.addEventListener('visibilitychange', flushIfLeaving);
    window.addEventListener('pagehide', flushIfLeaving);
    return () => {
      document.removeEventListener('visibilitychange', flushIfLeaving);
      window.removeEventListener('pagehide', flushIfLeaving);
    };
  }, [serverMode, flushPendingCheer]);

  useEffect(() => {
    if (!serverMode || !session?.serverSessionId || session.serverSyncedCheerCount < 5) {
      if (!serverMode) setSecretAssets([]);
      return;
    }
    let cancelled = false;
    void fetchEventSecret(session.serverSessionId).then((payload) => {
      if (!cancelled) setSecretAssets(payload.assets || []);
    }).catch(() => {
      if (!cancelled) setSecretAssets([]);
    });
    return () => { cancelled = true; };
  }, [serverMode, session?.serverSessionId, session?.serverSyncedCheerCount]);

  const setEntry = (nickname: string, side: EventSide) => {
    const next = session
      ? { ...session, nickname, side, fortuneIndex: null }
      : createLocalEventState(nickname, side);
    saveLocalEventState(next);
    sessionRef.current = next;
    setSession(next);
    setEditingEntry(false);
    setPassportOpen(true);
  };

  const closePassport = () => {
    setPassportOpen(false);
    updateSession((current) => ({ ...current, passportSeen: true }));
    window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('.event-pass-trigger')?.focus(), 0);
  };

  const showCombo = (message: string) => {
    setComboMessage(message);
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => setComboMessage(''), 2200);
  };

  const cheer = () => {
    if (!session) return;
    const nextCount = session.cheerCount + 1;
    const secretUnlocked = session.secretUnlocked || nextCount >= 5;
    const next = { ...session, cheerCount: nextCount, secretUnlocked };
    saveLocalEventState(next);
    sessionRef.current = next;
    setSession(next);
    setCheerPulse((value) => value + 1);
    if (!reducedMotion && typeof navigator.vibrate === 'function') navigator.vibrate(nextCount === 31 || nextCount === 100 ? 30 : 8);
    if (nextCount === 5) showCombo('SECRET UNLOCKED');
    else if (nextCount === 10) showCombo('10 CHEER COMBO');
    else if (nextCount === 31) showCombo('31 OCT COMBO');
    else if (nextCount === 100) showCombo('100 CHEERS');
  };

  const handleServerStats = useCallback((personalCheer: number, globalCheer: number) => {
    if (!serverMode) return;
    updateSession((current) => ({
      ...current,
      cheerCount: Math.max(current.cheerCount, personalCheer),
      serverSyncedCheerCount: Math.max(current.serverSyncedCheerCount, personalCheer),
      globalCheerCount: Math.max(current.globalCheerCount, globalCheer),
      secretUnlocked: current.secretUnlocked || personalCheer >= 5,
    }));
  }, [serverMode, updateSession]);

  const fortune = useMemo(() => {
    if (!session) return FORTUNES[0];
    const index = session.fortuneIndex ?? deterministicIndex(`${session.nickname}|${session.side}|2026-10-31`, FORTUNES.length);
    return FORTUNES[index % FORTUNES.length];
  }, [session]);

  const scratchMessage = useMemo(() => session ? SCRATCH_MESSAGES[deterministicIndex(`${session.nickname}|scratch`, SCRATCH_MESSAGES.length)] : SCRATCH_MESSAGES[0], [session]);
  const secretMessage = useMemo(() => session ? SECRET_MESSAGES[deterministicIndex(`${session.nickname}|secret`, SECRET_MESSAGES.length)] : SECRET_MESSAGES[0], [session]);

  const taskCount = session ? completedTaskCount(session) : 0;
  const tasks = session ? [
    { id: 'event-cheer', label: '축하 5번 보내고 비밀 열기', done: session.cheerCount >= 5 },
    { id: 'event-scratch', label: 'Scratch Card 긁어보기', done: session.scratchDone },
    { id: 'event-fortune', label: '오늘의 축복 받아가기', done: session.fortuneIndex !== null },
    { id: 'event-rolling-paper', label: '롤링페이퍼에 낙서 남기기', done: session.rollingPaperDone },
    { id: 'event-photo-pass', label: 'Halloween Photo Pass 만들기', done: session.photoPassDone },
  ] : [];

  const goToTask = (id: string) => {
    setPassportOpen(false);
    updateSession((current) => ({ ...current, passportSeen: true }));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }), 80);
  };

  const entranceCopy = phase === 'AFTER'
    ? { label: 'THANK YOU', title: 'HALLOWEEN WEDDING EVENT', detail: '이벤트는 마감되었습니다. 함께해주셔서 감사합니다.' }
    : canEnter
      ? { label: preview ? 'LOCAL PREVIEW' : 'WEDDING DAY OPEN', title: 'HALLOWEEN WEDDING EVENT', detail: preview ? '로컬 미리보기 모드입니다.' : '오늘만 열리는 작은 파티에 들어와 보세요.' }
      : { label: 'WEDDING DAY EXTRA', title: 'HALLOWEEN WEDDING EVENT', detail: '10월 31일 결혼식 당일에만 입장할 수 있어요.' };

  const statusLabel = preview ? 'LOCAL PREVIEW'
    : serverStatus === 'online' ? 'LIVE CONNECTED'
      : serverStatus === 'offline' ? 'LOCAL FALLBACK'
        : serverStatus === 'connecting' ? 'CONNECTING' : '';

  const overlay = open && typeof document !== 'undefined' ? createPortal(
    <div className="wedding-event-layer" role="dialog" aria-modal="true" aria-label="Halloween Wedding Event">
      <div className="wedding-event-shell" ref={dialogRef}>
        <header className="event-header">
          <div><small>SEUNGPYO × JEHEE</small><strong>HALLOWEEN WEDDING</strong></div>
          <button type="button" className="event-close" onClick={closeEvent} aria-label="이벤트 닫기">×</button>
        </header>

        {!session || editingEntry ? (
          <EventEntryForm current={session} serverRecording={serverMode} onSubmit={setEntry} />
        ) : (
          <>
            <button type="button" className="event-pass-trigger" onClick={() => setPassportOpen(true)} aria-label={`Wedding Event Pass ${taskCount}개 완료, 전체 ${tasks.length}개`}>
              <span>PASS</span><strong>{taskCount}/{tasks.length}</strong>
            </button>

            <section className="event-hero">
              <p className="event-kicker">WELCOME TO THE PARTY</p>
              <h2>{session.nickname}<span>님, 반가워요.</span></h2>
              <p>{sideLabel(session.side)} 하객으로 승표·제희의<br />Halloween Wedding에 입장했습니다.</p>
              {statusLabel && <div className={`event-live-status event-live-status--${serverStatus}`}><i />{statusLabel}</div>}
              <div className="event-hero__rule"><i /><PumpkinMark /><i /></div>
            </section>

            <section className="event-card event-cheer" id="event-cheer">
              <div className="event-section-head"><small>01 · TAP TO CELEBRATE</small><h3>축하를 마음껏 보내주세요.</h3><p>횟수 제한은 없습니다. 특정 횟수에서 작은 비밀과 효과가 열려요.</p></div>
              <div className="event-cheer__count"><strong>{session.cheerCount.toLocaleString('ko-KR')}</strong><span>{session.nickname}님의 CHEERS</span></div>
              {serverMode && <p className="event-cheer__global">ALL GUESTS · {session.globalCheerCount.toLocaleString('ko-KR')} CHEERS</p>}
              <button type="button" className="event-cheer-button" onClick={cheer} aria-label="축하 한 번 보내기">
                <PumpkinMark /><span>TAP TO CHEER</span>
                <span className="event-cheer-burst" key={cheerPulse} aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</span>
              </button>
              <div className="event-combo-guide"><span className={session.cheerCount >= 5 ? 'is-done' : ''}>5 · SECRET</span><span className={session.cheerCount >= 10 ? 'is-done' : ''}>10 · COMBO</span><span className={session.cheerCount >= 31 ? 'is-done' : ''}>31 · OCT</span><span className={session.cheerCount >= 100 ? 'is-done' : ''}>100 · MAX</span></div>
              {comboMessage && <div className="event-combo-pop" role="status">{comboMessage}</div>}
              {session.secretUnlocked && <div className="event-secret-note">
                <small>SECRET · UNLOCKED</small>
                <p>{secretMessage}</p>
                {secretAssets.length > 0 && <div className="event-secret-gallery">{secretAssets.map((asset) => <figure key={asset.id}><img src={asset.url} alt={asset.altText || 'Secret wedding photo'} style={{ objectPosition: asset.objectPosition || '50% 50%' }} /></figure>)}</div>}
                <span>{secretAssets.length ? '5 CHEERS COMPLETE · SECRET PHOTO OPEN' : '5 CHEERS COMPLETE · SECRET #01'}</span>
              </div>}
            </section>

            <section className="event-card" id="event-scratch">
              <div className="event-section-head"><small>02 · SCRATCH CARD</small><h3>긁어서 오늘의 비밀을 열어보세요.</h3><p>손가락으로 카드를 문지르면 안쪽의 작은 덕담이 나타납니다.</p></div>
              <EventScratchCard
                revealed={session.scratchDone}
                title={`${session.nickname}님의 숨은 행운`}
                message={scratchMessage}
                onReveal={() => updateSession((current) => ({ ...current, scratchDone: true }))}
              />
            </section>

            <section className="event-card" id="event-fortune">
              <div className="event-section-head"><small>03 · WEDDING FORTUNE</small><h3>오늘의 축복을 받아가세요.</h3><p>점괘보다는 오늘 함께해주신 분에게 건네는 작은 덕담에 가깝습니다.</p></div>
              {session.fortuneIndex === null ? (
                <button type="button" className="event-fortune-seal" onClick={() => {
                  const index = deterministicIndex(`${session.nickname}|${session.side}|2026-10-31`, FORTUNES.length);
                  updateSession((current) => ({ ...current, fortuneIndex: index }));
                }}>
                  <PumpkinMark /><strong>OPEN MY BLESSING</strong><span>{session.nickname}님에게 준비된 한 장의 카드</span>
                </button>
              ) : (
                <div className="event-fortune-result" aria-live="polite">
                  <small>TODAY'S WEDDING FORTUNE</small>
                  <h4>{fortune.headline}</h4>
                  <p>{fortune.body}</p>
                  <div><span>LUCKY MOMENT</span><strong>{fortune.lucky}</strong></div>
                </div>
              )}
            </section>

            <section className="event-card" id="event-rolling-paper">
              <div className="event-section-head"><small>04 · LIVE ROLLING PAPER</small><h3>오늘의 한 장을 직접 그려주세요.</h3><p>결혼식 당일에는 남겨주신 낙서가 다른 하객 화면의 Wedding Wall에도 함께 흘러갑니다.</p></div>
              <EventRollingPaper
                sessionId={serverMode ? session.serverSessionId : ''}
                nickname={session.nickname}
                side={session.side}
                completed={session.rollingPaperDone}
                onComplete={() => updateSession((current) => ({ ...current, rollingPaperDone: true }))}
                onStats={handleServerStats}
              />
            </section>

            <section className="event-card" id="event-photo-pass">
              <div className="event-section-head"><small>05 · HALLOWEEN PHOTO PASS</small><h3>오늘의 참석 인증 사진을 만들어보세요.</h3><p>사진은 서버에 올라가지 않습니다. 이 브라우저에서만 프레임을 합성해 바로 저장합니다.</p></div>
              <EventPhotoPass nickname={session.nickname} completed={session.photoPassDone} onComplete={() => updateSession((current) => ({ ...current, photoPassDone: true }))} />
            </section>

            <footer className="event-footer">
              <p>HAPPY HALLOWEEN · HAPPY WEDDING</p>
              <div><button type="button" className="event-text-button" onClick={() => setEditingEntry(true)}>입장 정보 바꾸기</button><button type="button" className="event-text-button" onClick={closeEvent}>청첩장으로 돌아가기</button></div>
            </footer>
          </>
        )}
      </div>

      {session && passportOpen && <div className="event-pass-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) closePassport(); }}>
        <div className="event-pass-panel" ref={passportRef} role="dialog" aria-modal="true" aria-labelledby="event-pass-title">
          <div className="event-pass-panel__top"><div><small>WEDDING EVENT PASS</small><h3 id="event-pass-title">{session.nickname}님의 오늘 할 일</h3></div><button type="button" onClick={closePassport} aria-label="Event Pass 닫기">×</button></div>
          <p className="event-pass-panel__intro">처음이라면 여기부터 보세요. 하고 싶은 것만 골라도 충분합니다.</p>
          <div className="event-pass-progress"><span><i style={{ width: `${(taskCount / Math.max(1, tasks.length)) * 100}%` }} /></span><strong>{taskCount} / {tasks.length}</strong></div>
          <div className="event-pass-tasks">
            {tasks.map((task, index) => <button type="button" key={task.id} className={task.done ? 'is-done' : ''} onClick={() => goToTask(task.id)}><span>{task.done ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>{task.label}</strong><em>↘</em></button>)}
          </div>
          <div className="event-pass-bonus"><small>BONUS</small><p>축하 버튼은 10 · 31 · 100회에서 추가 Combo 효과가 열립니다.</p></div>
          <button type="button" className="event-primary-button" onClick={closePassport}>{session.passportSeen ? 'EVENT로 돌아가기' : 'EVENT 시작하기'}</button>
        </div>
      </div>}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <section className={`event-entrance-section event-entrance-section--${phase.toLowerCase()}`} data-reveal>
        <p>{entranceCopy.label}</p>
        <h2>{entranceCopy.title}</h2>
        <button type="button" className={`pumpkin-entry ${canEnter ? 'is-open' : 'is-locked'}`} onClick={openEvent} disabled={!canEnter} aria-describedby="event-entrance-detail">
          <PumpkinMark />
          <span>{canEnter ? 'ENTER THE PARTY' : phase === 'AFTER' ? 'EVENT CLOSED' : '10.31 ONLY'}</span>
        </button>
        <small id="event-entrance-detail">{entranceCopy.detail}</small>
      </section>
      {overlay}
    </>
  );
}
