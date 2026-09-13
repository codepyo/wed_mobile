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
import { GuestDock, RsvpModal, type RsvpModalStage } from './components/GuestControls';
import { LocationSection } from './components/LocationSection';
import { WeddingEvent } from './components/WeddingEvent';
import { wedding } from './data/wedding';
import { canUseNativeShare, copyToClipboard, getInvitationUrl } from './utils/browser';
import { emptyMediaState, fetchPublicMedia } from './utils/media';
import { shareToKakao } from './utils/share';
import { defaultSiteConfig, fetchSiteConfig } from './utils/siteConfig';
import { useWeddingClock } from './utils/weddingEvent';

const WEDDING_EVENT_UI_ENABLED = false;
const RSVP_PROMPT_SEEN_KEY = 'wedding-rsvp-prompt-seen-v1';
const RSVP_SUBMITTED_KEY = 'wedding-rsvp-submitted-v1';

function App() {
  const [toast, setToast] = useState('');
  const [media, setMedia] = useState(emptyMediaState);
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const [siteConfigReady, setSiteConfigReady] = useState(false);
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [rsvpStage, setRsvpStage] = useState<RsvpModalStage>('intro');
  const weddingClock = useWeddingClock();
  const nativeShareAvailable = canUseNativeShare();

  useEffect(() => {
    void Promise.all([fetchPublicMedia(), fetchSiteConfig()]).then(([nextMedia, config]) => {
      setMedia(nextMedia);
      setSiteConfig(config);
      setSiteConfigReady(true);
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

  const deadline = siteConfig.rsvpDeadline ? Date.parse(siteConfig.rsvpDeadline) : Number.NaN;
  const rsvpAvailable = wedding.features.rsvp && siteConfig.rsvpEnabled && !(Number.isFinite(deadline) && Date.now() > deadline);

  useEffect(() => {
    if (!siteConfigReady || !rsvpAvailable) return;
    let seen = false;
    let submitted = false;
    try {
      seen = localStorage.getItem(RSVP_PROMPT_SEEN_KEY) === '1';
      submitted = localStorage.getItem(RSVP_SUBMITTED_KEY) === '1';
    } catch { /* private/storage-restricted browsers still work */ }
    if (seen || submitted) return;
    const timer = window.setTimeout(() => {
      setRsvpStage('intro');
      setRsvpModalOpen(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [siteConfigReady, rsvpAvailable]);

  const openRsvp = (stage: RsvpModalStage = 'intro') => {
    setRsvpStage(stage);
    setRsvpModalOpen(true);
  };

  const closeRsvp = () => {
    setRsvpModalOpen(false);
    try { localStorage.setItem(RSVP_PROMPT_SEEN_KEY, '1'); } catch { /* non-critical */ }
  };

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

  const contactsVisible = siteConfig.contactsEnabled && siteConfig.contacts.some((person) => person.phone.trim());
  const accountsVisible = siteConfig.accountsEnabled && (siteConfig.accounts.groom.length > 0 || siteConfig.accounts.bride.length > 0);

  return (
    <main className="invitation-shell">
      <MediaHeroSection image={media.hero} />
      <InvitationSection />
      <DateSection dday={weddingClock.dday} momentText={weddingClock.momentText} />
      <MediaGallerySection images={media.gallery} />
      <LocationSection onCopyAddress={() => copyText(wedding.ceremony.address, '주소가 복사되었습니다.')} />
      <ContactSection enabled={siteConfig.contactsEnabled} people={siteConfig.contacts} />
      <AccountSection enabled={siteConfig.accountsEnabled} accounts={siteConfig.accounts} onCopyText={copyText} />
      <RsvpSection onOpen={() => openRsvp('form')} />
      <GuestbookSection />
      <ClosingSection
        onShare={shareInvitation}
        onKakaoShare={kakaoShare}
        onCopyUrl={() => copyText(getInvitationUrl(), '청첩장 주소가 복사되었습니다.')}
        canNativeShare={nativeShareAvailable}
      />
      {WEDDING_EVENT_UI_ENABLED && <WeddingEvent phase={weddingClock.phase} canEnter={weddingClock.canEnterEvent} preview={weddingClock.preview} />}

      <GuestDock
        rsvpEnabled={rsvpAvailable}
        contactsVisible={contactsVisible}
        accountsVisible={accountsVisible}
        guestbookVisible={wedding.features.guestbook && siteConfig.guestbookEnabled}
        musicSrc={media.bgm?.url || ''}
        musicTitle={media.bgm?.altText || '배경음악'}
        musicEnabled={siteConfig.musicEnabled && Boolean(media.bgm?.url)}
        onOpenRsvp={() => openRsvp('intro')}
      />
      <RsvpModal open={rsvpModalOpen} stage={rsvpStage} onStageChange={setRsvpStage} onClose={closeRsvp} />
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}

export default App;
