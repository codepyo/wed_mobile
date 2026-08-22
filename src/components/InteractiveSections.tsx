import { FormEvent, useEffect, useState } from 'react';
import { SectionLabel } from './SectionLabel';
import { wedding } from '../data/wedding';

type GuestbookItem = {
  id: string;
  name: string;
  side?: 'GROOM' | 'BRIDE' | null;
  message: string;
  created_at: string;
};

export function RsvpSection() {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!wedding.features.rsvp) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name'),
      side: form.get('side'),
      attendance: form.get('attendance'),
      guestCount: Number(form.get('guestCount') || 1),
      meal: form.get('meal'),
      message: form.get('message'),
    };
    try {
      const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('submit failed');
      event.currentTarget.reset();
      setStatus('참석 여부가 전달되었습니다. 감사합니다.');
    } catch {
      setStatus('전달하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section interactive-section" data-reveal>
      <SectionLabel index="06" eyebrow="RSVP" title="참석 여부" />
      <p className="interactive-section__intro">준비에 도움이 될 수 있도록 참석 여부를 알려주시면 감사하겠습니다.</p>
      <form className="form-card" onSubmit={submit}>
        <label><span>이름</span><input name="name" required maxLength={30} autoComplete="name" /></label>
        <fieldset><legend>어느 분의 손님이신가요?</legend><div className="choice-grid"><label><input type="radio" name="side" value="GROOM" required /><span>신랑측</span></label><label><input type="radio" name="side" value="BRIDE" required /><span>신부측</span></label></div></fieldset>
        <fieldset><legend>참석 여부</legend><div className="choice-grid"><label><input type="radio" name="attendance" value="YES" required /><span>참석</span></label><label><input type="radio" name="attendance" value="NO" required /><span>불참</span></label></div></fieldset>
        <label><span>참석 인원</span><select name="guestCount" defaultValue="1">{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}명</option>)}</select></label>
        <label><span>식사 여부</span><select name="meal" defaultValue="UNKNOWN"><option value="YES">식사 예정</option><option value="UNKNOWN">미정</option><option value="NO">식사 안 함</option></select></label>
        <label><span>전달사항 <small>선택</small></span><textarea name="message" maxLength={500} rows={3} /></label>
        <button type="submit" className="form-submit" disabled={submitting}>{submitting ? '전달 중…' : '참석 여부 전달하기'}</button>
        {status && <p className="form-status" role="status">{status}</p>}
      </form>
    </section>
  );
}

export function GuestbookSection() {
  const [items, setItems] = useState<GuestbookItem[]>([]);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const enabled = wedding.features.guestbook;

  const load = async () => {
    try {
      const response = await fetch('/api/guestbook?limit=20');
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Public invitation remains usable even if guestbook is unavailable.
    }
  };

  useEffect(() => {
    if (enabled) void load();
  }, [enabled]);

  if (!enabled) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), side: form.get('side'), message: form.get('message'), deletePassword: form.get('deletePassword') };
    try {
      const response = await fetch('/api/guestbook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('submit failed');
      event.currentTarget.reset();
      setStatus('축하 메시지를 남겨주셔서 감사합니다.');
      await load();
    } catch {
      setStatus('메시지를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section guestbook-section" data-reveal>
      <SectionLabel index="07" eyebrow="Guestbook" title="축하의 마음" />
      <div className="guestbook-list">{items.map((item) => <article key={item.id}><div><strong>{item.name}</strong><small>{item.side === 'GROOM' ? '신랑측' : item.side === 'BRIDE' ? '신부측' : ''}</small></div><p>{item.message}</p></article>)}</div>
      <form className="form-card" onSubmit={submit}>
        <label><span>이름</span><input name="name" required maxLength={30} /></label>
        <label><span>구분</span><select name="side" defaultValue=""><option value="">선택 안 함</option><option value="GROOM">신랑측</option><option value="BRIDE">신부측</option></select></label>
        <label><span>축하 메시지</span><textarea name="message" required maxLength={300} rows={4} /></label>
        <label><span>삭제 비밀번호</span><input name="deletePassword" required minLength={4} maxLength={30} type="password" inputMode="numeric" /></label>
        <button type="submit" className="form-submit" disabled={submitting}>{submitting ? '등록 중…' : '메시지 남기기'}</button>
        {status && <p className="form-status" role="status">{status}</p>}
      </form>
    </section>
  );
}
