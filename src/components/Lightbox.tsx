import { useEffect, useRef, useState } from 'react';
import type { WeddingImage } from '../data/wedding';

type Props = {
  images: WeddingImage[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

type Offset = { x: number; y: number };

type TouchGesture =
  | {
      mode: 'swipe';
      startX: number;
      startY: number;
      startedAt: number;
    }
  | {
      mode: 'pan';
      startX: number;
      startY: number;
      startOffset: Offset;
    }
  | {
      mode: 'pinch';
      startDistance: number;
      startZoom: number;
    }
  | null;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.4;
const ZOOM_STEP = 0.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(touches: React.TouchList) {
  if (touches.length < 2) return 0;
  const first = touches[0];
  const second = touches[1];
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

export function Lightbox({ images, index, onChange, onClose }: Props) {
  const image = images[index];
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<TouchGesture>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const mousePanRef = useRef<{ pointerId: number; startX: number; startY: number; startOffset: Offset } | null>(null);
  const zoomRef = useRef(MIN_ZOOM);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const commitZoom = (nextZoom: number) => {
    const next = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = next;
    setZoom(next);
    if (next <= MIN_ZOOM + 0.01) {
      const origin = { x: 0, y: 0 };
      offsetRef.current = origin;
      setOffset(origin);
    }
  };

  const commitOffset = (nextOffset: Offset, atZoom = zoomRef.current) => {
    if (atZoom <= MIN_ZOOM + 0.01) {
      const origin = { x: 0, y: 0 };
      offsetRef.current = origin;
      setOffset(origin);
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
      return;
    }

    const maxX = viewport.clientWidth * (atZoom - 1) * 0.5;
    const maxY = viewport.clientHeight * (atZoom - 1) * 0.5;
    const clamped = {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
    offsetRef.current = clamped;
    setOffset(clamped);
  };

  const resetZoom = () => {
    zoomRef.current = MIN_ZOOM;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const changeImage = (nextIndex: number) => {
    resetZoom();
    onChange(nextIndex);
  };

  useEffect(() => {
    resetZoom();
    gestureRef.current = null;
    lastTapRef.current = null;
    mousePanRef.current = null;
  }, [index]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' && zoomRef.current <= MIN_ZOOM + 0.01) {
        event.preventDefault();
        changeImage((index - 1 + images.length) % images.length);
        return;
      }
      if (event.key === 'ArrowRight' && zoomRef.current <= MIN_ZOOM + 0.01) {
        event.preventDefault();
        changeImage((index + 1) % images.length);
        return;
      }
      if ((event.key === '+' || event.key === '=') && zoomRef.current < MAX_ZOOM) {
        event.preventDefault();
        commitZoom(zoomRef.current + ZOOM_STEP);
        return;
      }
      if ((event.key === '-' || event.key === '_') && zoomRef.current > MIN_ZOOM) {
        event.preventDefault();
        commitZoom(zoomRef.current - ZOOM_STEP);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const controls = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('[data-lightbox-control]'),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (!controls.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [images.length, index, onChange, onClose]);

  if (!image) return null;

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) {
      gestureRef.current = {
        mode: 'pinch',
        startDistance: touchDistance(event.touches),
        startZoom: zoomRef.current,
      };
      return;
    }

    const touch = event.touches[0];
    if (!touch) return;

    if (zoomRef.current > MIN_ZOOM + 0.01) {
      gestureRef.current = {
        mode: 'pan',
        startX: touch.clientX,
        startY: touch.clientY,
        startOffset: offsetRef.current,
      };
      return;
    }

    gestureRef.current = {
      mode: 'swipe',
      startX: touch.clientX,
      startY: touch.clientY,
      startedAt: Date.now(),
    };
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.mode === 'pinch' && event.touches.length >= 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      if (!gesture.startDistance || !distance) return;
      const nextZoom = clamp(
        gesture.startZoom * (distance / gesture.startDistance),
        MIN_ZOOM,
        MAX_ZOOM,
      );
      commitZoom(nextZoom);
      commitOffset(offsetRef.current, nextZoom);
      return;
    }

    if (gesture.mode === 'pan' && event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      commitOffset({
        x: gesture.startOffset.x + (touch.clientX - gesture.startX),
        y: gesture.startOffset.y + (touch.clientY - gesture.startY),
      });
    }
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (gesture?.mode === 'pinch') {
      if (zoomRef.current <= MIN_ZOOM + 0.05) resetZoom();
      if (event.touches.length === 1) {
        const remaining = event.touches[0];
        gestureRef.current = {
          mode: 'pan',
          startX: remaining.clientX,
          startY: remaining.clientY,
          startOffset: offsetRef.current,
        };
      } else {
        gestureRef.current = null;
      }
      return;
    }

    if (gesture?.mode === 'pan') {
      gestureRef.current = null;
      return;
    }

    if (gesture?.mode === 'swipe') {
      const touch = event.changedTouches[0];
      gestureRef.current = null;
      if (!touch) return;

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      const moved = Math.hypot(deltaX, deltaY);

      if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        if (deltaX > 0) changeImage((index - 1 + images.length) % images.length);
        else changeImage((index + 1) % images.length);
        lastTapRef.current = null;
        return;
      }

      if (moved <= 14 && Date.now() - gesture.startedAt <= 320) {
        const now = Date.now();
        const previousTap = lastTapRef.current;
        if (
          previousTap &&
          now - previousTap.time <= 300 &&
          Math.hypot(touch.clientX - previousTap.x, touch.clientY - previousTap.y) <= 42
        ) {
          lastTapRef.current = null;
          if (zoomRef.current > MIN_ZOOM + 0.01) resetZoom();
          else commitZoom(DOUBLE_TAP_ZOOM);
        } else {
          lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
        }
      }
    }
  };

  const onTouchCancel = () => {
    gestureRef.current = null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || zoomRef.current <= MIN_ZOOM + 0.01) return;
    mousePanRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offsetRef.current,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pan = mousePanRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    commitOffset({
      x: pan.startOffset.x + (event.clientX - pan.startX),
      y: pan.startOffset.y + (event.clientY - pan.startY),
    });
  };

  const endMousePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const pan = mousePanRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    mousePanRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (zoomRef.current > MIN_ZOOM + 0.01) resetZoom();
    else commitZoom(DOUBLE_TAP_ZOOM);
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    commitZoom(zoomRef.current + direction * 0.25);
  };

  const zoomed = zoom > MIN_ZOOM + 0.01;

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="웨딩 사진 크게 보기"
      onClick={onClose}
    >
      <button ref={closeButtonRef} data-lightbox-control className="lightbox__close" type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} aria-label="사진 닫기">×</button>
      <button
        data-lightbox-control
        className="lightbox__nav lightbox__nav--prev"
        type="button"
        disabled={zoomed}
        onClick={(event) => { event.stopPropagation(); changeImage((index - 1 + images.length) % images.length); }}
        aria-label={zoomed ? '확대 중에는 이전 사진으로 이동할 수 없습니다' : '이전 사진'}
      >‹</button>
      <div className="lightbox__stage" onClick={(event) => event.stopPropagation()}>
        <div
          ref={viewportRef}
          className={`lightbox__viewport${zoomed ? ' is-zoomed' : ''}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endMousePan}
          onPointerCancel={endMousePan}
          onDoubleClick={onDoubleClick}
          onWheel={onWheel}
          aria-label="사진 확대 영역. 두 손가락으로 확대하거나 두 번 탭하세요."
        >
          {image.src ? (
            <img
              src={image.src}
              alt={image.alt}
              draggable={false}
              style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }}
            />
          ) : <div className="lightbox__empty">사진 준비 중</div>}
        </div>
        <div className="lightbox__meta">
          <p aria-live="polite">{index + 1} / {images.length}</p>
          <div className="lightbox__zoom" aria-label="사진 확대 조절">
            <button
              data-lightbox-control
              type="button"
              disabled={zoom <= MIN_ZOOM + 0.01}
              onClick={() => commitZoom(zoomRef.current - ZOOM_STEP)}
              aria-label="축소"
            >−</button>
            <button
              data-lightbox-control
              type="button"
              className="lightbox__zoom-value"
              disabled={!zoomed}
              onClick={resetZoom}
              aria-label={zoomed ? '원래 크기로 되돌리기' : '원래 크기'}
            >{Math.round(zoom * 100)}%</button>
            <button
              data-lightbox-control
              type="button"
              disabled={zoom >= MAX_ZOOM - 0.01}
              onClick={() => commitZoom(zoomRef.current + ZOOM_STEP)}
              aria-label="확대"
            >＋</button>
          </div>
        </div>
      </div>
      <button
        data-lightbox-control
        className="lightbox__nav lightbox__nav--next"
        type="button"
        disabled={zoomed}
        onClick={(event) => { event.stopPropagation(); changeImage((index + 1) % images.length); }}
        aria-label={zoomed ? '확대 중에는 다음 사진으로 이동할 수 없습니다' : '다음 사진'}
      >›</button>
    </div>
  );
}
