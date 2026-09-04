import { useState } from 'react';
import { Calendar } from './Calendar';
import { CopyIcon, ShareIcon } from './Icons';
import { SectionLabel } from './SectionLabel';
import { wedding } from '../data/wedding';
import type { AccountItem, ContactItem } from '../data/wedding';
import { downloadWeddingIcs } from '../utils/calendar';

type CommonProps = {
  onCopyUrl: () => void;
  onCopyText: (value: string, message: string) => void;
  onShare: () => void;
  onKakaoShare: () => void;
  canNativeShare: boolean;
  dday: string;
  momentText: string;
};

export function InvitationSection() {
  return (
    <section className="section invitation" data-reveal>
      <SectionLabel index="01" eyebrow="Invitation" title="초대합니다" />
      <div className="invitation__copy">
        {wedding.invitation.map((line, index) => (
          <p key={line} className={index === wedding.invitation.length - 1 ? 'is-closing' : ''}>{line}</p>
        ))}
      </div>
      <div className="family-card" aria-label="신랑 신부 및 혼주">
        <div className="family-card__row">
          <p><span>{wedding.couple.groom.father} · {wedding.couple.groom.mother}</span><small>의 {wedding.couple.groom.relation}</small></p>
          <strong>{wedding.couple.groom.name}</strong>
        </div>
        <div className="family-card__row">
          <p><span>{wedding.couple.bride.father} · {wedding.couple.bride.mother}</span><small>의 {wedding.couple.bride.relation}</small></p>
          <strong>{wedding.couple.bride.name}</strong>
        </div>
      </div>
    </section>
  );
}

export function DateSection({ dday, momentText }: Pick<CommonProps, 'dday' | 'momentText'>) {
  const momentActive = momentText !== dday;
  return (
    <section className="date-section" data-reveal>
      <div className="date-section__topline"><span>THE WEDDING DAY</span><span className={momentActive ? 'is-wedding-moment' : ''} aria-live="polite">{momentText}</span></div>
      <div className="date-section__headline" aria-label="2026년 10월 31일"><span>OCT</span><strong>31</strong><span>2026</span></div>
      <p className="date-section__ceremony">{wedding.ceremony.year}년 {wedding.ceremony.month}월 {wedding.ceremony.day}일 {wedding.ceremony.weekday} · {wedding.ceremony.time}</p>
      <Calendar year={wedding.ceremony.year} month={wedding.ceremony.month} selectedDay={wedding.ceremony.day} />
      <div className="date-section__venue"><p>{wedding.ceremony.venue}</p><span>{wedding.ceremony.floor}</span></div>
      <button type="button" className="utility-button utility-button--dark" onClick={downloadWeddingIcs}>캘린더에 일정 추가</button>
    </section>
  );
}

export function ContactSection({ enabled, people }: { enabled: boolean; people: ContactItem[] }) {
  const visiblePeople = people.filter((person) => person.phone.trim());
  if (!enabled || !visiblePeople.length) return null;

  return (
    <section className="section contact-section" data-reveal>
      <SectionLabel index="04" eyebrow="Contact" title="연락하기" />
      <div className="contact-list">
        {visiblePeople.map((person) => {
          const phoneLink = person.phone.replace(/[^0-9+]/g, '');
          return (
            <div className="contact-row" key={person.id}>
              <div><small>{person.label}</small><strong>{person.name}</strong></div>
              <div className="contact-row__actions">
                <a href={`tel:${phoneLink}`} aria-label={`${person.label} ${person.name}에게 전화`}>전화</a>
                <a href={`sms:${phoneLink}`} aria-label={`${person.label} ${person.name}에게 문자`}>문자</a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AccountSection({
  enabled,
  accounts,
  onCopyText,
}: {
  enabled: boolean;
  accounts: { groom: AccountItem[]; bride: AccountItem[] };
  onCopyText: CommonProps['onCopyText'];
}) {
  const [openSide, setOpenSide] = useState<'groom' | 'bride' | null>(null);
  const hasAccounts = accounts.groom.length > 0 || accounts.bride.length > 0;
  if (!enabled || !hasAccounts) return null;

  const groups = [
    { key: 'groom' as const, title: '신랑측', items: accounts.groom },
    { key: 'bride' as const, title: '신부측', items: accounts.bride },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="section account-section" data-reveal>
      <SectionLabel index="05" eyebrow="With Gratitude" title="마음 전하실 곳" />
      <p className="account-section__intro">멀리서도 축하의 마음을 전하고 싶으신 분들을 위해 계좌번호를 안내드립니다.</p>
      <div className="account-groups">
        {groups.map((group) => {
          const open = openSide === group.key;
          const panelId = `account-panel-${group.key}`;
          return (
            <article className="account-group" key={group.key}>
              <button
                type="button"
                className="account-group__toggle"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenSide(open ? null : group.key)}
              >
                <span>{group.title} 계좌 보기</span><strong aria-hidden="true">{open ? '−' : '+'}</strong>
              </button>
              {open && (
                <div className="account-group__panel" id={panelId}>
                  {group.items.map((item) => (
                    <div className="account-item" key={item.id}>
                      <div><small>{item.label}</small><strong>{item.bank} {item.accountNumber}</strong><span>예금주 {item.holder}</span></div>
                      <button type="button" onClick={() => onCopyText(item.accountNumber.replace(/\s/g, ''), `${item.label} 계좌번호가 복사되었습니다.`)}>
                        <CopyIcon /><span>복사</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ClosingSection({
  onShare,
  onCopyUrl,
  onKakaoShare,
  canNativeShare,
}: Pick<CommonProps, 'onShare' | 'onCopyUrl' | 'onKakaoShare' | 'canNativeShare'>) {
  return (
    <section className="closing" data-reveal>
      <p className="closing__eyebrow">SAVE THE DATE</p>
      <h2><span>{wedding.couple.groom.name}</span><em>&amp;</em><span>{wedding.couple.bride.name}</span></h2>
      <p className="closing__date">2026. 10. 31 · SATURDAY · 12:00</p>
      <div className="closing__rule" />
      <p className="closing__venue">{wedding.ceremony.venue} · {wedding.ceremony.floor}</p>
      <div className="closing__actions">
        <button type="button" className="share-button" onClick={onKakaoShare}><ShareIcon /><span>카카오톡 공유</span></button>
        {canNativeShare && <button type="button" className="utility-button" onClick={onShare}><ShareIcon /><span>기기 공유</span></button>}
        <button type="button" className="utility-button" onClick={onCopyUrl}><CopyIcon /><span>URL 복사</span></button>
      </div>
      <p className="closing__note">WE LOOK FORWARD TO SEEING YOU</p>
    </section>
  );
}
