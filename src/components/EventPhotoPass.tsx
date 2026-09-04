import { ChangeEvent, useEffect, useRef, useState } from 'react';

type Position = 'top' | 'center' | 'bottom';

type Props = {
  nickname: string;
  completed: boolean;
  onComplete: () => void;
};

const POSITION_PERCENT: Record<Position, number> = { top: 22, center: 50, bottom: 78 };
const POSITION_FACTOR: Record<Position, number> = { top: 0.22, center: 0.5, bottom: 0.78 };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawPumpkin(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.save();
  context.fillStyle = '#ef8a35';
  context.beginPath();
  context.ellipse(x - size * 0.18, y, size * 0.3, size * 0.38, 0, 0, Math.PI * 2);
  context.ellipse(x + size * 0.18, y, size * 0.3, size * 0.38, 0, 0, Math.PI * 2);
  context.ellipse(x, y, size * 0.3, size * 0.42, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#6f7658';
  context.fillRect(x - size * 0.035, y - size * 0.52, size * 0.07, size * 0.18);
  context.restore();
}

export function EventPhotoPass({ nickname, completed, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [position, setPosition] = useState<Position>('center');
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('이미지 파일을 선택해 주세요.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus('사진은 25MB 이하로 선택해 주세요. 원본은 서버에 업로드되지 않습니다.');
      event.target.value = '';
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
    setFileName(file.name);
    setPosition('center');
    setZoom(1);
    setStatus('사진을 골랐어요. 위치와 확대 정도를 맞춘 뒤 저장해 주세요.');
  };

  const download = async () => {
    if (!photoUrl || rendering) return;
    setRendering(true);
    setStatus('인증 사진을 만들고 있어요…');
    try {
      const image = await loadImage(photoUrl);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('CANVAS_UNAVAILABLE');

      context.fillStyle = '#151210';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f3ecdf';
      context.textAlign = 'center';
      context.font = '600 34px system-ui, sans-serif';
      context.fillText('HALLOWEEN WEDDING', 540, 100);
      context.fillStyle = '#ef8a35';
      context.fillRect(90, 145, 900, 2);
      drawPumpkin(context, 540, 198, 58);

      const frame = { x: 90, y: 270, width: 900, height: 1230 };
      const baseScale = Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight);
      const scale = baseScale * zoom;
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const drawX = frame.x + (frame.width - drawWidth) / 2;
      const drawY = frame.y + (frame.height - drawHeight) * POSITION_FACTOR[position];

      context.save();
      context.beginPath();
      context.rect(frame.x, frame.y, frame.width, frame.height);
      context.clip();
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      context.restore();
      context.strokeStyle = '#ef8a35';
      context.lineWidth = 5;
      context.strokeRect(frame.x, frame.y, frame.width, frame.height);

      context.fillStyle = '#f3ecdf';
      context.font = '500 28px system-ui, sans-serif';
      context.fillText('SEUNGPYO  ×  JEHEE', 540, 1590);
      context.fillStyle = '#ef8a35';
      context.font = '700 68px Georgia, serif';
      context.fillText('31 OCT 2026', 540, 1680);
      context.fillStyle = 'rgba(243,236,223,.72)';
      context.font = '500 24px system-ui, sans-serif';
      context.fillText('RAMADA PLAZA SUWON · 12:00', 540, 1742);
      context.fillStyle = '#f3ecdf';
      context.font = '600 22px system-ui, sans-serif';
      context.fillText(`${nickname} · WEDDING GUEST`, 540, 1828);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('ENCODE_FAILED');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `seungpyo-jehee-halloween-pass-${Date.now()}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onComplete();
      setStatus('완성됐어요. 사진 앱에서 확인한 뒤 Instagram Story에 올려보세요.');
    } catch {
      setStatus('사진을 만들지 못했습니다. 다른 사진으로 다시 시도해 주세요.');
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="event-photo-pass">
      <input ref={inputRef} className="event-photo-pass__input" type="file" accept="image/*" onChange={choosePhoto} />
      <button type="button" className={`event-photo-slot ${photoUrl ? 'has-photo' : ''}`} onClick={() => inputRef.current?.click()}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="선택한 인증 사진 미리보기"
            style={{ objectPosition: `50% ${POSITION_PERCENT[position]}%`, transform: `scale(${zoom})` }}
          />
        ) : (
          <span className="event-photo-slot__empty"><i aria-hidden="true">+</i><strong>DROP YOUR PHOTO IN HERE</strong><small>탭해서 사진 또는 카메라 선택</small></span>
        )}
        <span className="event-photo-slot__frame" aria-hidden="true"><b>HALLOWEEN WEDDING</b><em>SEUNGPYO × JEHEE</em><small>31 OCT 2026</small></span>
      </button>
      <div className="event-photo-pass__meta">
        <span>{fileName || '사진은 이 브라우저에서만 처리됩니다.'}</span>
        {completed && <strong>PASS COMPLETE</strong>}
      </div>

      {photoUrl && <div className="event-photo-controls">
        <div className="event-photo-controls__row" role="group" aria-label="사진 세로 위치">
          {(['top', 'center', 'bottom'] as Position[]).map((value) => <button type="button" key={value} className={position === value ? 'is-active' : ''} onClick={() => setPosition(value)}>{value === 'top' ? '위' : value === 'center' ? '가운데' : '아래'}</button>)}
        </div>
        <label><span>확대</span><input type="range" min="1" max="1.8" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <button type="button" className="event-primary-button" disabled={rendering} onClick={() => void download()}>{rendering ? '만드는 중…' : 'Instagram 인증 사진 저장'}</button>
      </div>}
      {status && <p className="event-inline-status" role="status">{status}</p>}
    </div>
  );
}
