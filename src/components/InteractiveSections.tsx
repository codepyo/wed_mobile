import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { SectionLabel } from './SectionLabel';
import { TurnstileWidget } from './TurnstileWidget';
import { wedding } from '../data/wedding';

type GuestbookItem = {
  id: string;
  name: string;
  side?: 'GROOM' | 'BRIDE' | null;
  message: string;
  created_at: string;
};

type SiteConfig = {
  rsvpEnabled: boolean;
  rsvpDeadline: string;
  guestbookEnabled: boolean;
  guestbookWriteEnabled: boolean;
};

const defaultConfig: SiteConfig = {
  rsvpEnabled: true,
  rsvpDeadline: wedding.rsvp.fallbackDeadline,
  guestbookEnabled: true,
  guestbookWriteEnabled: true,
};

async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch('/api/site-config', { headers: { accept: 'application/json' } });
    if (!response.ok) return defaultConfig;
    const data = await response.json();
    return {
      rsvpEnabled: data.rsvpEnabled !== false,
      rsvpDeadline: String(data.rsvpDeadline || wedding.rsvp.fallbackDeadline || ''),
      guestbookEnabled: data.guestbookEnabled !== false,
      guestbookWriteEnabled: data.guestbookWriteEnabled !== false,
    };
  } catch {
    return defaultConfig;
  }
}

function isDeadlinePassed(value: string) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && Date.now() > timestamp;
}

export function RsvpSection() {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    if (wedding.features.rsvp) void getSiteConfig().then(setConfig);
  }, []);

  const closed = !config.rsvpEnabled || isDeadlinePassed(config.rsvpDeadline);
  const deadlineText = useMemo(() => {
    if (!config.rsvpDeadline) return '';
    const date = new Date(config.rsvpDeadline);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  }, [config.rsvpDeadline]);

  if (!wedding.features.rsvp) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || closed) return;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const attendance = String(form.get('attendance') || '');
    const payload = {
      name: form.get('name'),
      side: form.get('side'),
      attendance,
      guestCount: attendance === 'YES' ? Number(form.get('guestCount') || 1) : null,
      meal: attendance === 'YES' ? form.get('meal') : null,
      message: form.get('message'),
      turnstileToken,
    };
    try {
      const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error === 'RSVP_DEADLINE_PASSED' || data.error === 'RSVP_CLOSED') setConfig((current) => ({ ...current, rsvpEnabled: false }));
        throw new Error(String(data.error || 'submit failed'));
      }
      event.currentTarget.reset();
      setStatus('참석 여부가 전달되었습니다. 감사합니다.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(code === 'TURNSTILE_FAILED' ? '보안 확인이 만료되었습니다. 다시 확인 후 제출해 주세요.' : closed ? '참석 여부 전달이 마감되었습니다.' : '전달하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  return (
    <section className="section interactive-section" data-reveal>
      <SectionLabel index="06" eyebrow="RSVP" title="참석 여부" />
      <p className="interactive-section__intro">준비에 도움이 될 수 있도록 참석 여부를 알려주시면 감사하겠습니다.</p>
      {closed ? (
        <div className="form-closed"><strong>참석 여부 전달이 마감되었습니다.</strong><p>{deadlineText ? `${deadlineText}까지 전달된 응답을 기준으로 준비하고 있습니다.` : '변경이 필요하시면 신랑 또는 신부에게 연락해 주세요.'}</p></div>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <label><span>이름</span><input name="name" required maxLength={30} autoComplete="name" /></label>
          <fieldset><legend>어느 분의 손님이신가요?</legend><div className="choice-grid"><label><input type="radio" name="side" value="GROOM" required /><span>신랑측</span></label><label><input type="radio" name="side" value="BRIDE" required /><span>신부측</span></label></div></fieldset>
          <fieldset><legend>참석 여부</legend><div className="choice-grid"><label><input type="radio" name="attendance" value="YES" required /><span>참석</span></label><label><input type="radio" name="attendance" value="NO" required /><span>불참</span></label></div></fieldset>
          <label><span>참석 인원</span><select name="guestCount" defaultValue="1">{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}명</option>)}</select></label>
          <label><span>식사 여부</span><select name="meal" defaultValue="UNKNOWN"><option value="YES">식사 예정</option><option value="UNKNOWN">미정</option><option value="NO">식사 안 함</option></select></label>
          <label><span>전달사항 <small>선택</small></span><textarea name="message" maxLength={500} rows={3} /></label>
          <TurnstileWidget action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} />
          <button type="submit" className="form-submit" disabled={submitting}>{submitting ? '전달 중…' : '참석 여부 전달하기'}</button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      )}
    </section>
  );
}

export function GuestbookSection() {
  const [items, setItems] = useState<GuestbookItem[]>([]);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const enabled = wedding.features.guestbook;

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/guestbook?limit=20');
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // The invitation must remain usable even if the guestbook API is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void getSiteConfig().then(setConfig);
    void load();
  }, [enabled, load]);

  if (!enabled || !config.guestbookEnabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !config.guestbookWriteEnabled) return;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), side: form.get('side'), message: form.get('message'), deletePassword: form.get('deletePassword'), turnstileToken };
    try {
      const response = await fetch('/api/guestbook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error === 'GUESTBOOK_CLOSED') setConfig((current) => ({ ...current, guestbookWriteEnabled: false }));
        throw new Error(String(data.error || 'submit failed'));
      }
      event.currentTarget.reset();
      setStatus('축하 메시지를 남겨주셔서 감사합니다.');
      await load();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(code === 'TURNSTILE_FAILED' ? '보안 확인이 만료되었습니다. 다시 확인 후 등록해 주세요.' : '메시지를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  const remove = async (item: GuestbookItem) => {
    const deletePassword = window.prompt(`${item.name}님의 메시지를 삭제하려면 등록할 때 입력한 삭제 비밀번호를 입력해 주세요.`);
    if (!deletePassword) return;
    try {
      const response = await fetch(`/api/guestbook/${encodeURIComponent(item.id)}/delete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deletePassword }) });
      if (!response.ok) throw new Error('delete failed');
      setStatus('메시지가 삭제되었습니다.');
      await load();
    } catch {
      setStatus('삭제 비밀번호가 맞지 않거나 삭제할 수 없는 메시지입니다.');
    }
  };

  return (
    <section className="section guestbook-section" data-reveal>
      <SectionLabel index="07" eyebrow="Guestbook" title="축하의 마음" />
      <div className="guestbook-list">{items.map((item) => <article key={item.id}><div className="guestbook-list__head"><div><strong>{item.name}</strong><small>{item.side === 'GROOM' ? '신랑측' : item.side === 'BRIDE' ? '신부측' : ''}</small></div><button type="button" onClick={() => remove(item)}>삭제</button></div><p>{item.message}</p></article>)}</div>
      {config.guestbookWriteEnabled ? (
        <form className="form-card" onSubmit={submit}>
          <label><span>이름</span><input name="name" required maxLength={30} /></label>
          <label><span>구분</span><select name="side" defaultValue=""><option value="">선택 안 함</option><option value="GROOM">신랑측</option><option value="BRIDE">신부측</option></select></label>
          <label><span>축하 메시지</span><textarea name="message" required maxLength={300} rows={4} /></label>
          <label><span>삭제 비밀번호</span><input name="deletePassword" required minLength={4} maxLength={30} type="password" inputMode="numeric" /></label>
          <TurnstileWidget action="guestbook" onToken={setTurnstileToken} resetKey={turnstileReset} />
          <button type="submit" className="form-submit" disabled={submitting}>{submitting ? '등록 중…' : '메시지 남기기'}</button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      ) : <div className="form-closed"><strong>새로운 방명록 등록이 마감되었습니다.</strong><p>남겨주신 축하 메시지는 계속 볼 수 있습니다.</p></div>}
    </section>
  );
}
