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

  if (kakaoMapSdkPromise) return kakaoMapSdkPromise;

  kakaoMapSdkPromise = new Promise<KakaoMapApi>((resolve, reject) => {
    const finish = () => {
      if (!window.kakao?.maps) {
        reject(new Error('KAKAO_MAP_SDK_UNAVAILABLE'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    const existing = document.getElementById(KAKAO_MAP_SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('KAKAO_MAP_SDK_LOAD_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAP_SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = finish;
    script.onerror = () => reject(new Error('KAKAO_MAP_SDK_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return kakaoMapSdkPromise;
}

type Props = {
  latitude: number;
  longitude: number;
  venue: string;
};

export function KakaoMap({ latitude, longitude, venue }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
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
  }, [latitude, longitude]);

  return (
    <div className="map-preview kakao-map" aria-label={`${venue} 위치 지도`}>
      <div ref={containerRef} className="kakao-map__canvas" />
      {status !== 'ready' && (
        <div className="kakao-map__fallback" aria-live="polite">
          <div className="map-preview__grid" aria-hidden="true" />
          <div className="map-preview__pin" aria-hidden="true"><span /></div>
          <span>{status === 'loading' ? 'MAP LOADING' : 'MAP UNAVAILABLE'}</span>
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
