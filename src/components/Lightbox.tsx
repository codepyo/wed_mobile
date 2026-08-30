import { useEffect, useRef } from 'react';
import type { WeddingImage } from '../data/wedding';

type Props = {
  images: WeddingImage[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

export function Lightbox({ images, index, onChange, onClose }: Props) {
  const image = images[index];
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

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
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onChange((index - 1 + images.length) % images.length);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onChange((index + 1) % images.length);
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
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;
    if (startX == null || endX == null) return;
    const delta = endX - startX;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) onChange((index - 1 + images.length) % images.length);
    else onChange((index + 1) % images.length);
  };

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
      <button data-lightbox-control className="lightbox__nav lightbox__nav--prev" type="button" onClick={(event) => { event.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} aria-label="이전 사진">‹</button>
      <div className="lightbox__stage" onClick={(event) => event.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {image.src ? <img src={image.src} alt={image.alt} /> : <div className="lightbox__empty">사진 준비 중</div>}
        <p aria-live="polite">{index + 1} / {images.length}</p>
      </div>
      <button data-lightbox-control className="lightbox__nav lightbox__nav--next" type="button" onClick={(event) => { event.stopPropagation(); onChange((index + 1) % images.length); }} aria-label="다음 사진">›</button>
    </div>
  );
}
