import { useEffect, useMemo, useRef, useState } from 'react';
import { wedding } from '../data/wedding';
import { RsvpForm } from './InteractiveSections';
import { MusicControl } from './MusicControl';

export type RsvpModalStage = 'intro' | 'form' | 'done';

type RsvpModalProps = {
  open: boolean;
  stage: RsvpModalStage;
  onStageChange: (stage: RsvpModalStage) => void;
  onClose: () => void;
};

type GuestDockProps = {
  rsvpEnabled: boolean;
  contactsVisible: boolean;
  accountsVisible: boolean;
  guestbookVisible: boolean;
  musicSrc?: string;
  musicTitle?: string;
  musicEnabled: boolean;
  onOpenRsvp: () => void;
};

type NavItem = { id: string; index: string; label: string; note: string };

function getFocusable(root: HTMLElement | null) {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>;
}

function RsvpIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h10M7 12h10M7 19h6" /><circle cx="4" cy="5" r=".7" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r=".7" fill="currentColor" stroke="none" /><circle cx="4" cy="19" r=".7" fill="currentColor" stroke="none" /></svg>;
}

export function RsvpModal({ open, stage, onStageChange, onClose }: RsvpModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => getFocusable(panelRef.current)[0]?.focus(), 20);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = getFocusable(panelRef.current);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="guest-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="rsvp-modal" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="rsvp-modal-title">
        <div className="rsvp-modal__masthead">
          <div><small>WEDDING ATTENDANCE</small><span>승표 &amp; 제희</span></div>
          <button type="button" className="guest-icon-button" onClick={onClose} aria-label="참석 여부 창 닫기"><CloseIcon /></button>
        </div>

        {stage === 'intro' && <div className="rsvp-modal__intro">
          <p className="rsvp-modal__kicker">YOU'RE INVITED</p>
          <h2 id="rsvp-modal-title">함께해 주실 수 있나요?</h2>
          <p className="rsvp-modal__lead">더 정성껏 준비할 수 있도록<br />참석 여부를 미리 알려주시면 감사하겠습니다.</p>
          <div className="rsvp-summary-card">
            <div><small>DATE</small><strong>2026. 10. 31</strong><span>SAT · 12:00</span></div>
            <i aria-hidden="true" />
            <div><small>PLACE</small><strong>{wedding.ceremony.venue}</strong><span>{wedding.ceremony.floor}</span></div>
          </div>
          <p className="rsvp-modal__address">{wedding.ceremony.address}</p>
          <button type="button" className="editorial-cta" onClick={() => onStageChange('form')}><span>참석 여부 알리기</span><b aria-hidden="true">→</b></button>
          <button type="button" className="text-button" onClick={onClose}>청첩장 먼저 둘러보기</button>
        </div>}

        {stage === 'form' && <div className="rsvp-modal__form-view">
          <button type="button" className="rsvp-modal__back" onClick={() => onStageChange('intro')}>← 예식 안내</button>
          <div className="rsvp-modal__form-title"><small>RSVP</small><h2 id="rsvp-modal-title">참석 여부를 알려주세요</h2></div>
          <RsvpForm onSubmitted={() => onStageChange('done')} />
        </div>}

        {stage === 'done' && <div className="rsvp-modal__done">
          <div className="rsvp-modal__done-mark" aria-hidden="true"><span>✓</span></div>
          <small>RESPONSE RECEIVED</small>
          <h2 id="rsvp-modal-title">마음을 전해주셔서<br />감사합니다.</h2>
          <p>보내주신 참석 여부를 확인해<br />예식 준비에 소중히 반영하겠습니다.</p>
          <button type="button" className="editorial-cta" onClick={onClose}><span>청첩장 계속 보기</span><b aria-hidden="true">→</b></button>
        </div>}
      </div>
    </div>
  );
}

export function GuestDock({ rsvpEnabled, contactsVisible, accountsVisible, guestbookVisible, musicSrc, musicTitle, musicEnabled, onOpenRsvp }: GuestDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useMemo<NavItem[]>(() => {
    const next: NavItem[] = [
      { id: 'invitation', index: '01', label: '초대합니다', note: 'Invitation' },
      { id: 'schedule', index: '02', label: '예식 일정', note: 'Wedding Day' },
      { id: 'gallery', index: '03', label: '우리의 순간', note: 'Gallery' },
      { id: 'location', index: '04', label: '오시는 길', note: 'Location' },
    ];
    if (contactsVisible) next.push({ id: 'contact', index: '05', label: '연락하기', note: 'Contact' });
    if (accountsVisible) next.push({ id: 'account', index: '06', label: '마음 전하실 곳', note: 'Account' });
    if (rsvpEnabled) next.push({ id: 'rsvp', index: '07', label: '참석 여부', note: 'RSVP' });
    if (guestbookVisible) next.push({ id: 'letter', index: '08', label: '편지 남기기', note: 'Private Letter' });
    next.push({ id: 'closing', index: '09', label: '공유하기', note: 'Share' });
    return next;
  }, [accountsVisible, contactsVisible, guestbookVisible, rsvpEnabled]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const navigate = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return <>
    <nav className="guest-dock" aria-label="빠른 메뉴">
      <button type="button" className="guest-dock__button" onClick={() => setMenuOpen(true)} aria-label="청첩장 목록 열기"><MenuIcon /><span>MENU</span></button>
      {rsvpEnabled && <button type="button" className="guest-dock__button guest-dock__button--rsvp" onClick={onOpenRsvp}><RsvpIcon /><span>RSVP</span></button>}
      <MusicControl src={musicSrc} title={musicTitle} enabled={musicEnabled} variant="dock" />
    </nav>

    {menuOpen && <div className="guest-menu-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
      <div className="guest-menu-sheet" role="dialog" aria-modal="true" aria-label="청첩장 바로가기 메뉴">
        <div className="guest-menu-sheet__head"><div><small>QUICK INDEX</small><strong>원하는 곳으로 바로가기</strong></div><button type="button" className="guest-icon-button" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기"><CloseIcon /></button></div>
        <div className="guest-menu-sheet__list">{items.map((item) => <button key={item.id} type="button" onClick={() => navigate(item.id)}><small>{item.index}</small><span><strong>{item.label}</strong><em>{item.note}</em></span><b aria-hidden="true">↗</b></button>)}</div>
      </div>
    </div>}
  </>;
}
