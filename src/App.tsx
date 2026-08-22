import { useEffect, useMemo, useState } from 'react';
import {
  AccountSection,
  ClosingSection,
  ContactSection,
  DateSection,
  GallerySection,
  HeroSection,
  InvitationSection,
  LocationSection,
} from './components/Sections';
import { GuestbookSection, RsvpSection } from './components/InteractiveSections';
import { MusicControl } from './components/MusicControl';
import { wedding } from './data/wedding';
import { shareToKakao } from './utils/share';

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
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyText = async (value: string, success: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(success);
    } catch {
      setToast('복사하지 못했습니다.');
    }
  };

  const shareInvitation = async () => {
    const shareData = { title: wedding.share.title, text: wedding.share.description, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await copyText(window.location.href, '청첩장 주소가 복사되었습니다.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setToast('공유를 완료하지 못했습니다.');
    }
  };

  const kakaoShare = async () => {
    try {
      const shared = await shareToKakao();
      if (!shared) await shareInvitation();
    } catch {
      await shareInvitation();
    }
  };

  return (
    <main className="invitation-shell">
      <HeroSection />
      <InvitationSection />
      <ContactSection />
      <DateSection dday={dday} />
      <GallerySection />
      <LocationSection onCopyAddress={() => copyText(wedding.ceremony.address, '주소가 복사되었습니다.')} />
      <RsvpSection />
      <AccountSection onCopyText={copyText} />
      <GuestbookSection />
      <ClosingSection onShare={shareInvitation} onKakaoShare={kakaoShare} onCopyUrl={() => copyText(window.location.href, '청첩장 주소가 복사되었습니다.')} />
      <MusicControl />
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}

export default App;
