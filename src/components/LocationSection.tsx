import { ArrowUpRightIcon, CopyIcon } from './Icons';
import { KakaoMap } from './KakaoMap';
import { SectionLabel } from './SectionLabel';
import { wedding } from '../data/wedding';

type Props = {
  onCopyAddress: () => void;
};

export function LocationSection({ onCopyAddress }: Props) {
  const hasTmap = Boolean(wedding.mapLinks.tmap);

  return (
    <section className="location-section" data-reveal>
      <SectionLabel index="03" eyebrow="Location" title="오시는 길" inverted />
      <div className="location-summary">
        <p className="location-summary__en">RAMADA PLAZA SUWON</p>
        <h3>{wedding.ceremony.venue}</h3>
        <strong>{wedding.ceremony.floor}</strong>
        <p>{wedding.ceremony.address}</p>
      </div>

      <KakaoMap
        latitude={wedding.ceremony.latitude}
        longitude={wedding.ceremony.longitude}
        venue={wedding.ceremony.venue}
      />

      <div className={`map-actions ${hasTmap ? 'map-actions--four' : 'map-actions--three'}`}>
        <a href={wedding.mapLinks.kakao} target="_blank" rel="noreferrer" className="map-action"><span>카카오맵</span><ArrowUpRightIcon /></a>
        <a href={wedding.mapLinks.naver} target="_blank" rel="noreferrer" className="map-action"><span>네이버지도</span><ArrowUpRightIcon /></a>
        {hasTmap && <a href={wedding.mapLinks.tmap} target="_blank" rel="noreferrer" className="map-action"><span>TMAP</span><ArrowUpRightIcon /></a>}
        <button type="button" className="map-action" onClick={onCopyAddress}><span>주소 복사</span><CopyIcon /></button>
      </div>

      <div className="transport-list">
        {wedding.transport.map((item, index) => (
          <article className="transport-card" key={item.key}>
            <div className="transport-card__index">{String(index + 1).padStart(2, '0')}</div>
            <div className="transport-card__body">
              <small>{item.label}</small>
              <h3>{item.title}</h3>
              {item.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
