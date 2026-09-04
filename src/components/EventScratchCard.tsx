import { PointerEvent, useCallback, useEffect, useRef } from 'react';

type Props = {
  revealed: boolean;
  onReveal: () => void;
  title: string;
  message: string;
};

export function EventScratchCard({ revealed, onReveal, title, message }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scratchingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#28231f';
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = 'rgba(239, 141, 50, .16)';
    context.lineWidth = 1;
    for (let x = -rect.height; x < rect.width + rect.height; x += 24) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + rect.height, rect.height);
      context.stroke();
    }
    context.fillStyle = '#f0e7d7';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '600 12px system-ui, sans-serif';
    context.fillText('SCRATCH TO REVEAL', rect.width / 2, rect.height / 2 - 6);
    context.fillStyle = 'rgba(240, 231, 215, .64)';
    context.font = '500 10px system-ui, sans-serif';
    context.fillText('손가락으로 문질러 열어보세요', rect.width / 2, rect.height / 2 + 17);
  }, [revealed]);

  useEffect(() => {
    drawCover();
    const resize = () => drawCover();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawCover]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const scratchTo = (event: PointerEvent<HTMLCanvasElement>) => {
    if (revealed) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    const point = pointFromEvent(event);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const previous = lastPointRef.current || point;
    context.save();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalCompositeOperation = 'destination-out';
    context.strokeStyle = 'rgba(0,0,0,1)';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 34;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    lastPointRef.current = point;
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || revealed) return;
    try {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      let sampled = 0;
      const stride = 4 * 20;
      for (let index = 3; index < pixels.length; index += stride) {
        sampled += 1;
        if (pixels[index] < 90) transparent += 1;
      }
      if (sampled && transparent / sampled >= 0.42) onReveal();
    } catch {
      // Canvas is generated locally without cross-origin content; this is only a defensive fallback.
    }
  };

  return (
    <div className={`event-scratch-card ${revealed ? 'is-revealed' : ''}`}>
      <div className="event-scratch-card__message" aria-live="polite">
        <small>SECRET BLESSING</small>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <canvas
        ref={canvasRef}
        className="event-scratch-card__canvas"
        aria-label="긁어서 비밀 메시지 열기"
        onPointerDown={(event) => {
          if (revealed) return;
          scratchingRef.current = true;
          lastPointRef.current = pointFromEvent(event);
          event.currentTarget.setPointerCapture?.(event.pointerId);
          scratchTo(event);
        }}
        onPointerMove={(event) => {
          if (!scratchingRef.current) return;
          event.preventDefault();
          scratchTo(event);
        }}
        onPointerUp={(event) => {
          scratchingRef.current = false;
          lastPointRef.current = null;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
          checkProgress();
        }}
        onPointerCancel={() => {
          scratchingRef.current = false;
          lastPointRef.current = null;
        }}
      />
      {!revealed && <button type="button" className="event-text-button event-scratch-card__skip" onClick={onReveal}>한 번에 열기</button>}
    </div>
  );
}
