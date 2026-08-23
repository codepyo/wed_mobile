import { wedding } from '../data/wedding';
import { getInvitationUrl } from './browser';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_SDK_ID = 'kakao-js-sdk';
const KAKAO_SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js';
let kakaoSdkPromise: Promise<void> | null = null;

async function loadKakaoSdk() {
  if (window.Kakao) return window.Kakao;

  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise<void>((resolve, reject) => {
      const finish = () => window.Kakao ? resolve() : reject(new Error('KAKAO_SDK_UNAVAILABLE'));
      const fail = () => reject(new Error('KAKAO_SDK_LOAD_FAILED'));
      const existing = document.getElementById(KAKAO_SDK_ID) as HTMLScriptElement | null;

      if (existing) {
        if (window.Kakao) {
          resolve();
          return;
        }
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', fail, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = KAKAO_SDK_ID;
      script.src = KAKAO_SDK_SRC;
      script.async = true;
      script.onload = finish;
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch((error) => {
      kakaoSdkPromise = null;
      document.getElementById(KAKAO_SDK_ID)?.remove();
      throw error;
    });
  }

  await kakaoSdkPromise;
  if (!window.Kakao) throw new Error('KAKAO_SDK_UNAVAILABLE');
  return window.Kakao;
}

export async function shareToKakao() {
  const key = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
  if (!key) return false;

  const Kakao = await loadKakaoSdk();
  if (!Kakao.isInitialized()) Kakao.init(key);

  const url = getInvitationUrl();
  const imageUrl = `${window.location.origin}/api/og-image`;

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: wedding.share.title,
      description: wedding.share.description,
      imageUrl,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [{ title: '모바일 청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }],
  });
  return true;
}
