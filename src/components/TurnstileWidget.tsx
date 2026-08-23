import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  action: string;
  onToken: (token: string) => void;
  resetKey?: number;
};

type TurnstileState = 'loading' | 'ready' | 'expired' | 'timeout' | 'error' | 'missing-site-key';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function TurnstileWidget({ action, onToken, resetKey = 0 }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [state, setState] = useState<TurnstileState>(siteKey ? 'loading' : 'missing-site-key');
  const [errorCode, setErrorCode] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      setState('missing-site-key');
      onToken('');
      return;
    }

    let cancelled = false;

    const clearToken = (nextState: TurnstileState) => {
      onToken('');
      setState(nextState);
    };

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: 'light',
          size: 'flexible',
          retry: 'auto',
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          callback: (token: string) => {
            setErrorCode('');
            setState('ready');
            onToken(token);
          },
          'expired-callback': () => clearToken('expired'),
          'timeout-callback': () => clearToken('timeout'),
          'error-callback': (code: string) => {
            setErrorCode(String(code || 'unknown'));
            clearToken('error');
            return true;
          },
        });
      } catch (error) {
        console.error('TURNSTILE_RENDER_FAILED', error);
        setErrorCode('render-failed');
        clearToken('error');
      }
    };

    const scriptFailed = () => {
      document.getElementById(SCRIPT_ID)?.remove();
      setErrorCode('script-load-failed');
      clearToken('error');
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        render();
      } else {
        existing.addEventListener('load', render, { once: true });
        existing.addEventListener('error', scriptFailed, { once: true });
      }
    } else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      script.addEventListener('error', scriptFailed, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onToken, retryKey, siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      setState('loading');
      setErrorCode('');
      window.turnstile.reset(widgetIdRef.current);
      onToken('');
    }
  }, [onToken, resetKey]);

  if (!siteKey) {
    return <p className="turnstile-status turnstile-status--error" role="status">보안 모듈 Site Key가 빌드에 포함되지 않았습니다.</p>;
  }

  const retry = () => {
    setErrorCode('');
    setState('loading');
    onToken('');
    document.getElementById(SCRIPT_ID)?.remove();
    setRetryKey((value) => value + 1);
  };

  return (
    <div className="turnstile-block">
      <div className="turnstile-wrap" ref={containerRef} />
      {state === 'loading' && <p className="turnstile-status" role="status">보안 모듈을 불러오는 중입니다.</p>}
      {state === 'ready' && <p className="turnstile-status">보안 확인이 완료되었습니다.</p>}
      {state === 'expired' && <p className="turnstile-status">보안 확인이 만료되어 자동으로 갱신 중입니다.</p>}
      {state === 'timeout' && <p className="turnstile-status">보안 확인 시간이 초과되어 다시 확인 중입니다.</p>}
      {state === 'error' && (
        <div className="turnstile-retry" role="alert">
          <p className="turnstile-status turnstile-status--error">보안 확인을 완료하지 못했습니다.{errorCode ? ` (${errorCode})` : ''}</p>
          <button type="button" onClick={retry}>보안 확인 다시 시도</button>
        </div>
      )}
    </div>
  );
}
