import { useEffect } from 'react';
import type { WeddingImage } from '../data/wedding';

type Props = {
  images: WeddingImage[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
};

export function Lightbox({ images, index, onChange, onClose }: Props) {
  const image = images[index];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [images.length, index, onChange, onClose]);

  if (!image) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="웨딩 사진 크게 보기" onClick={onClose}>
      <button className="lightbox__close" type="button" onClick={onClose} aria-label="사진 닫기">×</button>
      <button className="lightbox__nav lightbox__nav--prev" type="button" onClick={(event) => { event.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} aria-label="이전 사진">‹</button>
      <div className="lightbox__stage" onClick={(event) => event.stopPropagation()}>
        {image.src ? <img src={image.src} alt={image.alt} /> : <div className="lightbox__empty">사진 준비 중</div>}
        <p>{index + 1} / {images.length}</p>
      </div>
      <button className="lightbox__nav lightbox__nav--next" type="button" onClick={(event) => { event.stopPropagation(); onChange((index + 1) % images.length); }} aria-label="다음 사진">›</button>
    </div>
  );
}
