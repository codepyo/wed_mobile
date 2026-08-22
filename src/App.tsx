import { useEffect, useMemo, useState } from 'react';
import { Calendar } from './components/Calendar';
import { ArrowUpRightIcon, CopyIcon, ShareIcon } from './components/Icons';
import { PhotoFrame } from './components/PhotoFrame';
import { SectionLabel } from './components/SectionLabel';
import { wedding } from './data/wedding';

function getDdayLabel() {
  const target = new Date(wedding.ceremony.isoDate).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today.getTime()) / 86_400_000);

  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return 'D-DAY';
  return `D+${Math.abs(diff)}`;
}

function App() {
  const [toast, setToast] = useState('');
  const dday = useMemo(getDdayLabel, []);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wedding.ceremony.address);
      setToast('주소를 복사했습니다.');
    } catch {
      setToast(wedding.ceremony.address);
    }
  };

  const shareInvitation = async () => {
    const shareData = {
      title: `${wedding.couple.groom.name} & ${wedding.couple.bride.name}, 결혼합니다`,
      text: `2026년 10월 31일 토요일 낮 12시 · ${wedding.ceremony.venue} ${wedding.ceremony.floor}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setToast('청첩장 주소를 복사했습니다.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setToast('공유 링크를 다시 시도해 주세요.');
    }
  };

  return (
    <main className="invitation-shell">
      <section className="hero">
        <div className="hero__meta">
          <span>OUR WEDDING</span>
          <span>SUWON · 2026</span>
        </div>
        <PhotoFrame src={wedding.images.hero} alt={`${wedding.couple.groom.name}와 ${wedding.couple.bride.name} 대표 웨딩 사진`} index="00" className="photo-frame--hero" />
        <div className="hero__orange-block" aria-hidden="true" />
        <div className="hero__names">
          <p className="hero__kicker">TOGETHER, FROM THIS DAY FORWARD</p>
          <h1><span>{wedding.couple.groom.englishName}</span><em>&amp;</em><span>{wedding.couple.bride.englishName}</span></h1>
          <div className="hero__date-row"><strong>10.31</strong><span>2026 · SAT · 12:00</span></div>
        </div>
        <div className="hero__scroll"><span>SCROLL</span><i /></div>
      </section>

      <section className="section invitation" data-reveal>
        <SectionLabel index="01" eyebrow="Invitation" title="초대합니다" />
        <div className="invitation__copy">
          {wedding.invitation.map((line, index) => <p key={line} className={index === wedding.invitation.length - 1 ? 'is-closing' : ''}>{line}</p>)}
        </div>
        <div className="family-card">
          <div className="family-card__row"><span className="family-card__parents">{wedding.couple.groom.father} · {wedding.couple.groom.mother}</span><span className="family-card__relation">의 {wedding.couple.groom.relation}</span><strong>{wedding.couple.groom.name}</strong></div>
          <div className="family-card__line" />
          <div className="family-card__row"><span className="family-card__parents">{wedding.couple.bride.father} · {wedding.couple.bride.mother}</span><span className="family-card__relation">의 {wedding.couple.bride.relation}</span><strong>{wedding.couple.bride.name}</strong></div>
        </div>
      </section>

      <section className="date-section" data-reveal>
        <div className="date-section__topline"><span>THE DATE</span><span>{dday}</span></div>
        <div className="date-section__headline"><span>OCT</span><strong>31</strong><span>2026</span></div>
        <p className="date-section__ceremony">{wedding.ceremony.year}년 {wedding.ceremony.month}월 {wedding.ceremony.day}일 {wedding.ceremony.weekday} · {wedding.ceremony.time}</p>
        <Calendar year={wedding.ceremony.year} month={wedding.ceremony.month} selectedDay={wedding.ceremony.day} />
        <div className="date-section__venue"><p>{wedding.ceremony.venue}</p><span>{wedding.ceremony.floor}</span></div>
      </section>

      <section className="section gallery" data-reveal>
        <SectionLabel index="02" eyebrow="Our Frames" title="웨딩 화보" />
        <p className="gallery__intro">흑백과 블랙·오렌지 톤의 웨딩 사진을 기준으로 구성한 에디토리얼 갤러리입니다. 사진은 나중에 파일만 교체하면 같은 레이아웃으로 바로 반영됩니다.</p>
        <div className="gallery-grid">
          <PhotoFrame src={wedding.images.gallery[0]} alt="웨딩 화보 1" index="01" className="gallery-grid__portrait" />
          <PhotoFrame src={wedding.images.gallery[1]} alt="웨딩 화보 2" index="02" className="gallery-grid__landscape" />
          <div className="gallery-grid__quote"><span>THE STORY</span><p>Rain, distance,<br />and all the days between.</p></div>
          <PhotoFrame src={wedding.images.gallery[2]} alt="웨딩 화보 3" index="03" className="gallery-grid__square" />
          <PhotoFrame src={wedding.images.gallery[3]} alt="웨딩 화보 4" index="04" className="gallery-grid__tall" />
          <PhotoFrame src={wedding.images.gallery[4]} alt="웨딩 화보 5" index="05" className="gallery-grid__wide" />
          <PhotoFrame src={wedding.images.gallery[5]} alt="웨딩 화보 6" index="06" className="gallery-grid__portrait" />
        </div>
      </section>

      <section className="location-section" data-reveal>
        <SectionLabel index="03" eyebrow="Location" title="오시는 길" inverted />
        <div className="location-card">
          <div className="location-card__number">37°16′N</div>
          <div className="location-card__pin" aria-hidden="true"><i /></div>
          <div className="location-card__grid" aria-hidden="true" />
          <div className="location-card__content"><p className="location-card__eyebrow">RAMADA PLAZA SUWON</p><h3>{wedding.ceremony.venue}</h3><strong>{wedding.ceremony.floor}</strong><p>{wedding.ceremony.address}</p></div>
        </div>
        <div className="map-actions">
          <a href={wedding.mapLinks.kakao} target="_blank" rel="noreferrer" className="map-action map-action--orange"><span>카카오맵 길찾기</span><ArrowUpRightIcon /></a>
          <a href={wedding.mapLinks.naver} target="_blank" rel="noreferrer" className="map-action"><span>네이버 지도</span><ArrowUpRightIcon /></a>
          <button type="button" className="map-action" onClick={copyAddress}><span>주소 복사</span><CopyIcon /></button>
        </div>
        <div className="transport-list">
          {wedding.transport.map((item, index) => (
            <article className="transport-card" key={item.key}>
              <div className="transport-card__head"><span>{String(index + 1).padStart(2, '0')}</span><div><small>{item.label}</small><h3>{item.title}</h3></div></div>
              <div className="transport-card__copy">{item.lines.map((line) => <p key={line}>{line}</p>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="closing" data-reveal>
        <p className="closing__eyebrow">SAVE THE DATE</p>
        <h2><span>{wedding.couple.groom.name}</span><em>&amp;</em><span>{wedding.couple.bride.name}</span></h2>
        <p className="closing__date">2026. 10. 31 · SATURDAY · 12:00</p>
        <div className="closing__rule" />
        <p className="closing__venue">{wedding.ceremony.venue} · {wedding.ceremony.floor}</p>
        <button type="button" className="share-button" onClick={shareInvitation}><ShareIcon /><span>청첩장 공유하기</span></button>
        <p className="closing__note">SEE YOU ON OUR DAY</p>
      </section>

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

export default App;
