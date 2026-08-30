import { useEffect, useRef, useState } from 'react';

type KakaoLatLng = unknown;

type KakaoMapInstance = {
  setDraggable: (enabled: boolean) => void;
  setZoomable: (enabled: boolean) => void;
};

type KakaoMapApi = {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  Marker: new (options: { position: KakaoLatLng }) => {
    setMap: (map: KakaoMapInstance) => void;
  };
};

type KakaoMapGlobal = {
  maps: KakaoMapApi;
};

declare global {
  interface Window {
    kakao?: KakaoMapGlobal;
  }
}

const KAKAO_MAP_SDK_ID = 'kakao-map-sdk';
let kakaoMapSdkPromise: Promise<KakaoMapApi> | null = null;

function loadKakaoMapSdk(appKey: string): Promise<KakaoMapApi> {
  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (!kakaoMapSdkPromise) {
    kakaoMapSdkPromise = new Promise<KakaoMapApi>((resolve, reject) => {
      const finish = () => {
        if (!window.kakao?.maps) {
          reject(new Error('KAKAO_MAP_SDK_UNAVAILABLE'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao!.maps));
      };
      const fail = () => reject(new Error('KAKAO_MAP_SDK_LOAD_FAILED'));
      const existing = document.getElementById(KAKAO_MAP_SDK_ID) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', fail, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = KAKAO_MAP_SDK_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
      script.onload = finish;
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch((error) => {
      kakaoMapSdkPromise = null;
      document.getElementById(KAKAO_MAP_SDK_ID)?.remove();
      throw error;
    });
  }

  return kakaoMapSdkPromise;
}

type Props = {
  latitude: number;
  longitude: number;
  venue: string;
};

export function KakaoMap({ latitude, longitude, venue }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '480px 0px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
    const container = containerRef.current;
    if (!appKey || !container) {
      setStatus('failed');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    void loadKakaoMapSdk(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const position = new maps.LatLng(latitude, longitude);
        const map = new maps.Map(containerRef.current, {
          center: position,
          level: 3,
        });
        map.setDraggable(false);
        map.setZoomable(false);

        const marker = new maps.Marker({ position });
        marker.setMap(map);
        setStatus('ready');
      })
      .catch((error) => {
        console.error('KAKAO_MAP_LOAD_FAILED', error);
        if (!cancelled) setStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, retryKey, shouldLoad]);

  const retry = () => {
    setShouldLoad(true);
    setRetryKey((value) => value + 1);
  };

  return (
    <div ref={rootRef} className="map-preview kakao-map" aria-label={`${venue} 위치 지도`}>
      <div ref={containerRef} className="kakao-map__canvas" />
      {status !== 'ready' && (
        <div className="kakao-map__fallback" aria-live="polite">
          <div className="map-preview__grid" aria-hidden="true" />
          <div className="map-preview__pin" aria-hidden="true"><span /></div>
          {status === 'failed' ? (
            <button type="button" className="kakao-map__retry" onClick={retry}>지도 다시 불러오기</button>
          ) : (
            <span>{status === 'loading' ? 'MAP LOADING' : 'RAMADA PLAZA SUWON'}</span>
          )}
        </div>
      )}
      {status === 'ready' && (
        <div className="kakao-map__venue" aria-hidden="true">
          <strong>RAMADA PLAZA SUWON</strong>
          <span>KAKAO MAP</span>
        </div>
      )}
    </div>
  );
}
