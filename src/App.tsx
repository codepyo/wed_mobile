import { useEffect, useState } from 'react';
import {
  AccountSection,
  ClosingSection,
  ContactSection,
  DateSection,
  InvitationSection,
} from './components/Sections';
import { MediaGallerySection, MediaHeroSection } from './components/MediaSections';
import { GuestbookSection, RsvpSection } from './components/InteractiveSections';
import { LocationSection } from './components/LocationSection';
import { MusicControl } from './components/MusicControl';
import { WeddingEvent } from './components/WeddingEvent';
import { wedding } from './data/wedding';
import { canUseNativeShare, copyToClipboard, getInvitationUrl } from './utils/browser';
import { emptyMediaState, fetchPublicMedia } from './utils/media';
import { shareToKakao } from './utils/share';
import { defaultSiteConfig, fetchSiteConfig } from './utils/siteConfig';
import { useWeddingClock } from './utils/weddingEvent';

function App() {
  const [toast, setToast] = useState('');
  const [media, setMedia] = useState(emptyMediaState);
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const weddingClock = useWeddingClock();
  const nativeShareAvailable = canUseNativeShare();

  useEffect(() => {
    void Promise.all([fetchPublicMedia(), fetchSiteConfig()]).then(([nextMedia, config]) => {
      setMedia(nextMedia);
      setSiteConfig(config);
    });
  }, []);

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
  }, [media.gallery.length, siteConfig.contactsEnabled, siteConfig.accountsEnabled]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const copyText = async (value: string, success: string) => {
    const copied = await copyToClipboard(value);
    setToast(copied ? success : '복사하지 못했습니다.');
  };

  const shareInvitation = async () => {
    const url = getInvitationUrl();
    const shareData = { title: wedding.share.title, text: wedding.share.description, url };

    if (!canUseNativeShare()) {
      await copyText(url, '청첩장 주소가 복사되었습니다.');
      return;
    }

    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyText(url, '기기 공유를 사용할 수 없어 청첩장 주소를 복사했습니다.');
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
      <MediaHeroSection image={media.hero} />
      <InvitationSection />
      <DateSection dday={weddingClock.dday} momentText={weddingClock.momentText} />
      <MediaGallerySection images={media.gallery} />
      <LocationSection onCopyAddress={() => copyText(wedding.ceremony.address, '주소가 복사되었습니다.')} />
      <ContactSection enabled={siteConfig.contactsEnabled} people={siteConfig.contacts} />
      <AccountSection enabled={siteConfig.accountsEnabled} accounts={siteConfig.accounts} onCopyText={copyText} />
      <RsvpSection />
      <GuestbookSection />
      <ClosingSection
        onShare={shareInvitation}
        onKakaoShare={kakaoShare}
        onCopyUrl={() => copyText(getInvitationUrl(), '청첩장 주소가 복사되었습니다.')}
        canNativeShare={nativeShareAvailable}
      />
      <WeddingEvent phase={weddingClock.phase} canEnter={weddingClock.canEnterEvent} preview={weddingClock.preview} />
      <MusicControl src={media.bgm?.url || ''} title={media.bgm?.altText || '배경음악'} enabled={siteConfig.musicEnabled && Boolean(media.bgm?.url)} />
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}

export default App;
