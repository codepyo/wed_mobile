import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEventDrawings, postEventDrawing, type EventDrawing, type EventStroke } from '../utils/weddingEventApi';
import type { EventSide } from '../utils/weddingEvent';

const COLORS = ['#f4eee4', '#ef8a35', '#9aab84', '#b8a1c4', '#d96c5f'] as const;
const WIDTHS = [3, 6, 10] as const;
const AUTO_SLIDE_MS = 4_800;
const USER_PAUSE_MS = 8_000;

type Props = {
  sessionId: string;
  nickname: string;
  side: EventSide;
  completed: boolean;
  onComplete: () => void;
  onStats?: (personalCheer: number, globalCheer: number) => void;
};

function renderStrokes(canvas: HTMLCanvasElement, strokes: EventStroke[], background = '#171412') {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = background;
  context.fillRect(0, 0, rect.width, rect.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    context.beginPath();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    stroke.points.forEach(([x, y], index) => {
      const px = x * rect.width;
      const py = y * rect.height;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });
    if (stroke.points.length === 1) {
      const [x, y] = stroke.points[0];
      context.lineTo(x * rect.width + 0.01, y * rect.height + 0.01);
    }
    context.stroke();
  }
}

function DrawingPreview({ drawing }: { drawing: EventDrawing }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => renderStrokes(canvas, drawing.strokes, '#efe5d6');
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawing]);

  return (
    <article className="rolling-feed-card">
      <canvas ref={ref} aria-label={`${drawing.nickname}님의 롤링페이퍼 낙서`} />
      <div><strong>{drawing.nickname}</strong><span>{drawing.side === 'GROOM' ? '신랑측' : '신부측'}</span></div>
      {drawing.caption && <p>{drawing.caption}</p>}
    </article>
  );
}

export function EventRollingPaper({ sessionId, nickname, side, completed, onComplete, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedTrackRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const autoPauseUntilRef = useRef(0);
  const [strokes, setStrokes] = useState<EventStroke[]>([]);
  const [color, setColor] = useState<(typeof COLORS)[number]>('#f4eee4');
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(6);
  const [caption, setCaption] = useState('');
  const [feed, setFeed] = useState<EventDrawing[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const localMode = !sessionId;
  const canSubmit = strokes.some((stroke) => stroke.points.length > 0) && !saving;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => renderStrokes(canvas, strokes);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const refresh = async (quiet = false) => {
      try {
        const payload = await fetchEventDrawings(sessionId);
        if (cancelled) return;
        setFeed(payload.drawings || []);
        onStats?.(payload.personalCheer || 0, payload.globalCheer || 0);
        if (!quiet) setStatus('당일 롤링페이퍼와 연결되었습니다.');
      } catch {
        if (!cancelled && !quiet) setStatus('롤링페이퍼 연결이 잠시 불안정합니다. 그림은 지우지 않고 그대로 유지합니다.');
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId, onStats]);

  useEffect(() => {
    if (feed.length < 2) return;
    const timer = window.setInterval(() => {
      if (Date.now() < autoPauseUntilRef.current) return;
      const track = feedTrackRef.current;
      if (!track) return;
      const cards = Array.from(track.querySelectorAll<HTMLElement>('.rolling-feed-card'));
      if (cards.length < 2) return;

      const currentCenter = track.scrollLeft + track.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - currentCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nextIndex = (nearestIndex + 1) % cards.length;
      const next = cards[nextIndex];
      const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      const target = Math.min(maxLeft, Math.max(0, next.offsetLeft - (track.clientWidth - next.offsetWidth) / 2));
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      track.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [feed.length]);

  const pauseAutoSlide = () => {
    autoPauseUntilRef.current = Date.now() + USER_PAUSE_MS;
  };

  const normalizedPoint = (event: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height)));
    return [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000];
  };

  const startStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = normalizedPoint(event);
    setStrokes((current) => [...current, { color, width, points: [point] }]);
  };

  const continueStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const point = normalizedPoint(event);
    setStrokes((current) => {
      if (!current.length) return current;
      const next = current.slice();
      const last = next[next.length - 1];
      if (last.points.length >= 800) return current;
      const previous = last.points[last.points.length - 1];
      if (previous && Math.abs(previous[0] - point[0]) + Math.abs(previous[1] - point[1]) < 0.0025) return current;
      next[next.length - 1] = { ...last, points: [...last.points, point] };
      return next;
    });
  };

  const endStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setStatus(localMode ? 'Preview 롤링페이퍼에 붙이고 있어요…' : '롤링페이퍼에 붙이고 있어요…');
    try {
      let drawing: EventDrawing;
      if (localMode) {
        drawing = {
          id: `preview-${Date.now()}`,
          nickname,
          side,
          caption: caption.trim().slice(0, 60),
          strokes,
          createdAt: new Date().toISOString(),
        };
      } else {
        const payload = await postEventDrawing({ sessionId, strokes, caption: caption.trim().slice(0, 60) });
        drawing = payload.drawing;
      }
      setFeed((current) => [drawing, ...current.filter((item) => item.id !== drawing.id)].slice(0, 16));
      setStrokes([]);
      setCaption('');
      onComplete();
      setStatus(localMode ? 'Preview에 붙였습니다. 결혼식 당일에는 다른 하객 화면에도 함께 나타납니다.' : '완료! 다른 하객의 화면에도 곧 함께 나타납니다.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(code === 'DRAWING_LIMIT_REACHED'
        ? '한 분당 최대 6장까지 남길 수 있어요. 이미 충분한 마음을 보내주셨습니다.'
        : '전송하지 못했습니다. 그림은 그대로 남아 있으니 잠시 후 다시 눌러주세요.');
    } finally {
      setSaving(false);
    }
  };

  const feedTitle = useMemo(() => localMode ? 'PREVIEW WALL' : 'LIVE WEDDING WALL', [localMode]);

  return (
    <div className="event-rolling-paper">
      <div className="rolling-editor">
        <div className="rolling-toolbar" aria-label="낙서 도구">
          <div className="rolling-colors" role="group" aria-label="펜 색상">
            {COLORS.map((item) => <button key={item} type="button" className={color === item ? 'is-active' : ''} style={{ '--pen-color': item } as React.CSSProperties} onClick={() => setColor(item)} aria-label={`색상 ${item}`} />)}
          </div>
          <div className="rolling-widths" role="group" aria-label="펜 굵기">
            {WIDTHS.map((item) => <button key={item} type="button" className={width === item ? 'is-active' : ''} onClick={() => setWidth(item)} aria-label={`펜 굵기 ${item}`}><i style={{ width: item, height: item }} /></button>)}
          </div>
        </div>
        <div className="rolling-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="rolling-canvas"
            aria-label="승표와 제희에게 남길 낙서 영역"
            onPointerDown={startStroke}
            onPointerMove={continueStroke}
            onPointerUp={endStroke}
            onPointerCancel={() => { drawingRef.current = false; }}
          />
          {!strokes.length && <div className="rolling-canvas-placeholder" aria-hidden="true"><strong>DRAW SOMETHING FOR US</strong><span>손가락으로 자유롭게 그려보세요</span></div>}
        </div>
        <div className="rolling-editor-actions">
          <button type="button" onClick={() => setStrokes((current) => current.slice(0, -1))} disabled={!strokes.length}>Undo</button>
          <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length}>Clear</button>
        </div>
        <label className="rolling-caption"><span>한 줄 남기기 <small>선택</small></span><input value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 60))} maxLength={60} placeholder="예: 오래오래 행복해!" /></label>
        <button type="button" className="event-primary-button" onClick={() => void submit()} disabled={!canSubmit}>{saving ? '붙이는 중…' : '롤링페이퍼에 붙이기'}</button>
        {completed && <p className="rolling-complete">✓ PASSPORT COMPLETE</p>}
        {status && <p className="event-inline-status" role="status">{status}</p>}
      </div>

      <div className="rolling-feed">
        <div className="rolling-feed__head"><small>{feedTitle}</small><span>{feed.length ? `${feed.length} CARDS · AUTO` : 'WAITING FOR FIRST CARD'}</span></div>
        {feed.length ? <div
          className="rolling-feed-track"
          ref={feedTrackRef}
          tabIndex={0}
          aria-label="하객 롤링페이퍼. 자동으로 넘어가며 좌우로 직접 밀어서 볼 수 있습니다."
          onPointerDown={pauseAutoSlide}
          onWheel={pauseAutoSlide}
          onKeyDown={pauseAutoSlide}
          onFocus={pauseAutoSlide}
        >{feed.map((drawing) => <DrawingPreview key={drawing.id} drawing={drawing} />)}</div> : <div className="rolling-feed-empty"><strong>첫 낙서를 기다리고 있어요.</strong><span>당신의 한 장이 이 공간의 시작이 될 수 있어요.</span></div>}
      </div>
    </div>
  );
}
