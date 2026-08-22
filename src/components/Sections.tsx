import { useState } from 'react';
import { Calendar } from './Calendar';
import { ArrowUpRightIcon, CopyIcon, ShareIcon } from './Icons';
import { Lightbox } from './Lightbox';
import { PhotoFrame } from './PhotoFrame';
import { SectionLabel } from './SectionLabel';
import { wedding } from '../data/wedding';
import { downloadWeddingIcs } from '../utils/calendar';

type CommonProps = {
  onCopyAddress: () => void;
  onCopyUrl: () => void;
  onShare: () => void;
  dday: string;
};

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__topline">
        <span>2026 · OCTOBER · 31</span>
        <span>SUWON</span>
      </div>
      <div className="hero__photo-wrap">
        <PhotoFrame
          src={wedding.images.hero.src}
          alt={wedding.images.hero.alt}
          ratio={wedding.images.hero.ratio}
          position={wedding.images.hero.position}
          className="photo-frame--hero"
          priority
        />
      </div>
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

export function InvitationSection() {
  return (
    <section className="section invitation" data-reveal>
      <SectionLabel index="01" eyebrow="Invitation" title="초대합니다" />
      <div className="invitation__copy">
        {wedding.invitation.map((line, index) => <p key={line} className={index === wedding.invitation.length - 1 ? 'is-closing' : ''}>{line}</p>)}
      </div>
      <div className="family-card" aria-label="신랑 신부 및 혼주">
        <div className="family-card__row"><p><span>{wedding.couple.groom.father} · {wedding.couple.groom.mother}</span><small>의 {wedding.couple.groom.relation}</small></p><strong>{wedding.couple.groom.name}</strong></div>
        <div className="family-card__row"><p><span>{wedding.couple.bride.father} · {wedding.couple.bride.mother}</span><small>의 {wedding.couple.bride.relation}</small></p><strong>{wedding.couple.bride.name}</strong></div>
      </div>
    </section>
  );
}

export function DateSection({ dday }: Pick<CommonProps, 'dday'>) {
  return (
    <section className="date-section" data-reveal>
      <div className="date-section__topline"><span>THE WEDDING DAY</span><span>{dday}</span></div>
      <div className="date-section__headline" aria-label="2026년 10월 31일"><span>OCT</span><strong>31</strong><span>2026</span></div>
      <p className="date-section__ceremony">{wedding.ceremony.year}년 {wedding.ceremony.month}월 {wedding.ceremony.day}일 {wedding.ceremony.weekday} · {wedding.ceremony.time}</p>
      <Calendar year={wedding.ceremony.year} month={wedding.ceremony.month} selectedDay={wedding.ceremony.day} />
      <div className="date-section__venue"><p>{wedding.ceremony.venue}</p><span>{wedding.ceremony.floor}</span></div>
      <button type="button" className="utility-button utility-button--dark" onClick={downloadWeddingIcs}>캘린더에 일정 추가</button>
    </section>
  );
}

export function GallerySection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <section className="section gallery" data-reveal>
      <SectionLabel index="02" eyebrow="Our Moments" title="우리의 순간" />
      <p className="gallery__intro">함께 지나온 시간 속,<br />오래 기억하고 싶은 순간들을 담았습니다.</p>
      <div className="gallery-grid">
        {wedding.images.gallery.map((image, index) => (
          <button className={`gallery-grid__button gallery-grid__item--${index + 1}`} type="button" key={`${image.alt}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`${image.alt} 크게 보기`}>
            <PhotoFrame src={image.src} alt={image.alt} ratio={image.ratio} position={image.position} />
          </button>
        ))}
      </div>
      {activeIndex !== null && <Lightbox images={wedding.images.gallery} index={activeIndex} onChange={setActiveIndex} onClose={() => setActiveIndex(null)} />}
    </section>
  );
}

export function LocationSection({ onCopyAddress }: Pick<CommonProps, 'onCopyAddress'>) {
  return (
    <section className="location-section" data-reveal>
      <SectionLabel index="03" eyebrow="Location" title="오시는 길" inverted />
      <div className="location-summary"><p className="location-summary__en">RAMADA PLAZA SUWON</p><h3>{wedding.ceremony.venue}</h3><strong>{wedding.ceremony.floor}</strong><p>{wedding.ceremony.address}</p></div>
      <div className="map-preview" aria-label="라마다프라자수원호텔 위치 안내"><div className="map-preview__grid" aria-hidden="true" /><div className="map-preview__pin" aria-hidden="true"><span /></div><p>RAMADA PLAZA<br />SUWON</p></div>
      <div className="map-actions">
        <a href={wedding.mapLinks.kakao} target="_blank" rel="noreferrer" className="map-action"><span>카카오맵</span><ArrowUpRightIcon /></a>
        <a href={wedding.mapLinks.naver} target="_blank" rel="noreferrer" className="map-action"><span>네이버지도</span><ArrowUpRightIcon /></a>
        <button type="button" className="map-action" onClick={onCopyAddress}><span>주소 복사</span><CopyIcon /></button>
      </div>
      <div className="transport-list">
        {wedding.transport.map((item, index) => <article className="transport-card" key={item.key}><div className="transport-card__index">{String(index + 1).padStart(2, '0')}</div><div className="transport-card__body"><small>{item.label}</small><h3>{item.title}</h3>{item.lines.map((line) => <p key={line}>{line}</p>)}</div></article>)}
      </div>
    </section>
  );
}

export function ContactSection() {
  if (!wedding.features.contacts) return null;
  const people = [wedding.couple.groom, wedding.couple.bride].filter((person) => person.phone);
  if (!people.length) return null;
  return <section className="section contact-section" data-reveal><SectionLabel index="04" eyebrow="Contact" title="연락하기" /><div className="contact-list">{people.map((person) => <div className="contact-row" key={person.name}><strong>{person.name}</strong><div><a href={`tel:${person.phone}`}>전화</a><a href={`sms:${person.phone}`}>문자</a></div></div>)}</div></section>;
}

export function AccountSection() {
  if (!wedding.features.accounts) return null;
  return <section className="section account-section" data-reveal><SectionLabel index="05" eyebrow="For Your Heart" title="마음 전하실 곳" /><p className="feature-empty">계좌 정보 입력 후 활성화됩니다.</p></section>;
}

export function ClosingSection({ onShare, onCopyUrl }: Pick<CommonProps, 'onShare' | 'onCopyUrl'>) {
  return (
    <section className="closing" data-reveal>
      <p className="closing__eyebrow">SAVE THE DATE</p>
      <h2><span>{wedding.couple.groom.name}</span><em>&amp;</em><span>{wedding.couple.bride.name}</span></h2>
      <p className="closing__date">2026. 10. 31 · SATURDAY · 12:00</p>
      <div className="closing__rule" />
      <p className="closing__venue">{wedding.ceremony.venue} · {wedding.ceremony.floor}</p>
      <div className="closing__actions"><button type="button" className="share-button" onClick={onShare}><ShareIcon /><span>청첩장 공유하기</span></button><button type="button" className="utility-button" onClick={onCopyUrl}><CopyIcon /><span>URL 복사</span></button></div>
      <p className="closing__note">WE LOOK FORWARD TO SEEING YOU</p>
    </section>
  );
}
