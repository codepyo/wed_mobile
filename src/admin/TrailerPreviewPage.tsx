import { useEffect, useMemo, useRef, useState } from 'react';
import { InvitationSection } from '../components/Sections';

type TrailerAsset = {
  id: string;
  slot: string;
  mime_type: string;
  size_bytes: number;
  alt_text?: string | null;
  active: number;
  created_at: string;
};

type MediaPayload = {
  assets?: TrailerAsset[];
};

function formatBytes(value: number) {
  const bytes = Number(value || 0);
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function TrailerPreviewPage() {
  const [asset, setAsset] = useState<TrailerAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.trailer-preview-page [data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/media', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as MediaPayload & { error?: string };
        if (!response.ok) throw new Error(data.error || 'MEDIA_LOAD_FAILED');
        if (cancelled) return;
        const trailer = (data.assets || []).find((item) => item.slot === 'TRAILER' && Number(item.active) === 1) || null;
        setAsset(trailer);
      })
      .catch(() => {
        if (!cancelled) setError('예고편 영상을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const source = useMemo(
    () => asset ? `/api/admin/trailer/${encodeURIComponent(asset.id)}` : '',
    [asset],
  );

  const isMp4 = asset?.mime_type === 'video/mp4';

  return (
    <main className="trailer-preview-page">
      <header className="trailer-preview-bar">
        <div>
          <small>PRIVATE PREVIEW</small>
          <strong>Wedding Trailer</strong>
        </div>
        <a href="/admin">Admin으로 돌아가기</a>
      </header>

      <section className="trailer-preview-film" aria-label="웨딩 예고편 샘플">
        <div className="trailer-preview-film__copy">
          <p>A FILM FOR OUR WEDDING</p>
          <h1>Before<br />we say “I do”</h1>
          <span>SEUNGPYO &amp; JEHEE · 2026.10.31</span>
        </div>

        <div className="trailer-preview-player">
          {loading && <div className="trailer-preview-state">영상을 준비하고 있습니다…</div>}
          {!loading && error && <div className="trailer-preview-state">{error}</div>}
          {!loading && !error && !asset && (
            <div className="trailer-preview-state">
              <strong>아직 업로드된 Wedding Trailer가 없습니다.</strong>
              <span>Admin → Media에서 영상을 먼저 업로드해 주세요.</span>
            </div>
          )}
          {!loading && asset && (
            <>
              <video
                ref={videoRef}
                src={source}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onContextMenu={(event) => event.preventDefault()}
              >
                브라우저가 HTML5 video 재생을 지원하지 않습니다.
              </video>
              <div className="trailer-preview-player__meta">
                <span>{asset.alt_text || 'Wedding Trailer'}</span>
                <span>{formatBytes(asset.size_bytes)} · {asset.mime_type}</span>
              </div>
              {!isMp4 && (
                <p className="trailer-preview-compat">
                  이 파일은 브라우저에 따라 재생되지 않을 수 있습니다. 실제 공개용은 MP4 · H.264 영상 / AAC 오디오 조합을 권장합니다.
                </p>
              )}
            </>
          )}
        </div>

        <div className="trailer-preview-cue" aria-hidden="true">
          <span>THE INVITATION CONTINUES</span>
          <i />
        </div>
      </section>

      <div className="trailer-preview-invitation">
        <InvitationSection />
      </div>
    </main>
  );
}
