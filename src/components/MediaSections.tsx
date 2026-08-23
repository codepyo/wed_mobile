import { useState } from 'react';
import type { WeddingImage } from '../data/wedding';
import { wedding } from '../data/wedding';
import { Lightbox } from './Lightbox';
import { PhotoFrame } from './PhotoFrame';
import { SectionLabel } from './SectionLabel';

export function MediaHeroSection({ image }: { image?: WeddingImage | null }) {
  const hero = image || wedding.images.hero;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__topline"><span>2026 · OCTOBER · 31</span><span>SUWON</span></div>
      <div className="hero__photo-wrap"><PhotoFrame src={hero.src} alt={hero.alt} ratio={hero.ratio} position={hero.position} className="photo-frame--hero" priority /></div>
      <div className="hero__identity">
        <p className="hero__eyebrow">WE ARE GETTING MARRIED</p>
        <h1 id="hero-title"><span>{wedding.couple.groom.englishName}</span><em>&amp;</em><span>{wedding.couple.bride.englishName}</span></h1>
        <p className="hero__names-ko">{wedding.couple.groom.name} · {wedding.couple.bride.name}</p>
        <div className="hero__details"><span>2026. 10. 31 SAT · 12:00</span><span>RAMADA PLAZA SUWON</span></div>
      </div>
      <div className="hero__scroll" aria-hidden="true"><span>SCROLL</span><i /></div>
    </section>
  );
}

export function MediaGallerySection({ images }: { images?: WeddingImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gallery = images?.length ? images : wedding.images.gallery;

  return (
    <section className="section gallery" data-reveal>
      <SectionLabel index="02" eyebrow="Our Moments" title="우리의 순간" />
      <p className="gallery__intro">함께 지나온 시간 속,<br />오래 기억하고 싶은 순간들을 담았습니다.</p>
      <div className="gallery-grid">{gallery.map((image, index) => <button className={`gallery-grid__button gallery-grid__item--${index + 1}`} type="button" key={`${image.src}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`${image.alt} 크게 보기`}><PhotoFrame src={image.src} alt={image.alt} ratio={image.ratio} position={image.position} /></button>)}</div>
      {activeIndex !== null && <Lightbox images={gallery} index={activeIndex} onChange={setActiveIndex} onClose={() => setActiveIndex(null)} />}
    </section>
  );
}
