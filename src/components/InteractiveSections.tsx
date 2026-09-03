import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SectionLabel } from './SectionLabel';
import { TurnstileWidget } from './TurnstileWidget';
import { wedding } from '../data/wedding';
import { defaultSiteConfig, fetchSiteConfig } from '../utils/siteConfig';

function isDeadlinePassed(value: string) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && Date.now() > timestamp;
}

export function RsvpSection() {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(defaultSiteConfig);
  const [attendance, setAttendance] = useState<'YES' | 'NO' | ''>('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  useEffect(() => {
    if (wedding.features.rsvp) void fetchSiteConfig().then(setConfig);
  }, []);

  const closed = !config.rsvpEnabled || isDeadlinePassed(config.rsvpDeadline);
  const securityPending = config.turnstileEnabled && !turnstileToken;
  const deadlineText = useMemo(() => {
    if (!config.rsvpDeadline) return '';
    const date = new Date(config.rsvpDeadline);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }, [config.rsvpDeadline]);

  if (!wedding.features.rsvp) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || closed) return;
    if (securityPending) {
      setStatus('보안 확인이 완료된 후 제출해 주세요.');
      return;
    }

    const formElement = event.currentTarget;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(formElement);
    const selectedAttendance = String(form.get('attendance') || '');
    const payload = {
      name: form.get('name'),
      side: form.get('side'),
      attendance: selectedAttendance,
      guestCount: selectedAttendance === 'YES' ? Number(form.get('guestCount') || 1) : null,
      meal: selectedAttendance === 'YES' ? form.get('meal') : null,
      message: form.get('message'),
      turnstileToken,
    };

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error === 'RSVP_DEADLINE_PASSED' || data.error === 'RSVP_CLOSED') {
          setConfig((current) => ({ ...current, rsvpEnabled: false }));
        }
        throw new Error(String(data.error || 'submit failed'));
      }
      formElement.reset();
      setAttendance('');
      setStatus('참석 여부가 전달되었습니다. 감사합니다.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(
        code === 'TURNSTILE_FAILED'
          ? '보안 확인에 실패했습니다. 잠시 후 다시 확인하고 제출해 주세요.'
          : closed
            ? '참석 여부 전달이 마감되었습니다.'
            : '전달하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
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
        <div className="form-closed">
          <strong>참석 여부 전달이 마감되었습니다.</strong>
          <p>{deadlineText ? `${deadlineText}까지 전달된 응답을 기준으로 준비하고 있습니다.` : '변경이 필요하시면 신랑 또는 신부에게 연락해 주세요.'}</p>
        </div>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <label><span>이름</span><input name="name" required maxLength={30} autoComplete="name" /></label>
          <fieldset>
            <legend>어느 분의 손님이신가요?</legend>
            <div className="choice-grid">
              <label><input type="radio" name="side" value="GROOM" required /><span>신랑측</span></label>
              <label><input type="radio" name="side" value="BRIDE" required /><span>신부측</span></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>참석 여부</legend>
            <div className="choice-grid">
              <label><input type="radio" name="attendance" value="YES" required onChange={() => setAttendance('YES')} /><span>참석</span></label>
              <label><input type="radio" name="attendance" value="NO" required onChange={() => setAttendance('NO')} /><span>불참</span></label>
            </div>
          </fieldset>
          {attendance === 'YES' && (
            <>
              <label><span>참석 인원</span><select name="guestCount" defaultValue="1">{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}명</option>)}</select></label>
              <label><span>식사 여부</span><select name="meal" defaultValue="UNKNOWN"><option value="YES">식사 예정</option><option value="UNKNOWN">미정</option><option value="NO">식사 안 함</option></select></label>
            </>
          )}
          <label><span>전달사항 <small>선택</small></span><textarea name="message" maxLength={500} rows={3} /></label>
          <TurnstileWidget action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} />
          <button type="submit" className="form-submit" disabled={submitting || securityPending}>
            {submitting ? '전달 중…' : securityPending ? '보안 확인 중…' : '참석 여부 전달하기'}
          </button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      )}
    </section>
  );
}

export function GuestbookSection() {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState(defaultSiteConfig);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const enabled = wedding.features.guestbook;
  const securityPending = config.turnstileEnabled && !turnstileToken;

  useEffect(() => {
    if (enabled) void fetchSiteConfig().then(setConfig);
  }, [enabled]);

  if (!enabled || !config.guestbookEnabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !config.guestbookWriteEnabled) return;
    if (securityPending) {
      setStatus('보안 확인이 완료된 후 전달해 주세요.');
      return;
    }

    const formElement = event.currentTarget;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(formElement);
    const payload = {
      name: form.get('name'),
      side: form.get('side'),
      message: form.get('message'),
      turnstileToken,
    };

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error === 'GUESTBOOK_CLOSED') {
          setConfig((current) => ({ ...current, guestbookWriteEnabled: false }));
        }
        throw new Error(String(data.error || 'submit failed'));
      }
      formElement.reset();
      setStatus('소중한 마음이 승표·제희에게 전달되었습니다. 감사합니다.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(
        code === 'TURNSTILE_FAILED'
          ? '보안 확인에 실패했습니다. 잠시 후 다시 확인하고 전달해 주세요.'
          : '편지를 전달하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  return (
    <section className="section guestbook-section private-letter-section" data-reveal>
      <SectionLabel index="07" eyebrow="Private Letter" title="승표·제희에게 전하는 마음" />
      <div className="private-letter-note">
        <small>PRIVATE & CONFIDENTIAL</small>
        <p>남겨주신 편지는 공개되지 않고<br />승표·제희에게만 조용히 전달됩니다.</p>
      </div>
      {config.guestbookWriteEnabled ? (
        <form className="form-card" onSubmit={submit}>
          <label><span>이름</span><input name="name" required maxLength={30} autoComplete="name" /></label>
          <label><span>구분 <small>선택</small></span><select name="side" defaultValue=""><option value="">선택 안 함</option><option value="GROOM">신랑측</option><option value="BRIDE">신부측</option></select></label>
          <label><span>승표·제희에게 전할 편지</span><textarea name="message" required maxLength={1000} rows={6} placeholder="축하와 응원의 마음을 자유롭게 남겨주세요." /></label>
          <TurnstileWidget action="guestbook" onToken={setTurnstileToken} resetKey={turnstileReset} />
          <button type="submit" className="form-submit" disabled={submitting || securityPending}>
            {submitting ? '전달 중…' : securityPending ? '보안 확인 중…' : '마음 전하기'}
          </button>
          {status && <p className="form-status" role="status">{status}</p>}
        </form>
      ) : (
        <div className="form-closed"><strong>편지 남기기가 마감되었습니다.</strong><p>전해주신 마음은 승표·제희에게 소중히 전달되어 있습니다.</p></div>
      )}
    </section>
  );
}
