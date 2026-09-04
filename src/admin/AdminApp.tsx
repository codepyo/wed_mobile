import { FormEvent, useEffect, useMemo, useState } from 'react';
import EventAdminPanel, { type EventAdminData, type EventAdminDrawing } from './EventAdminPanel';

type DashboardData = {
  rsvp?: {
    responses?: number;
    attending_responses?: number;
    declined_responses?: number;
    attending_people?: number;
    groom_people?: number;
    bride_people?: number;
    meal_people?: number;
    meal_unknown_people?: number;
  };
  guestbook?: { total?: number; hidden?: number };
  recentActivity?: Array<{ id: string; action: string; summary?: string; created_at: string }>;
};

type RsvpItem = {
  id: string;
  name: string;
  side: 'GROOM' | 'BRIDE';
  attendance: 'YES' | 'NO';
  guest_count?: number | null;
  meal?: 'YES' | 'NO' | 'UNKNOWN' | null;
  message?: string | null;
  created_at: string;
};

type PrivateLetterItem = {
  id: string;
  name: string;
  side?: 'GROOM' | 'BRIDE' | null;
  message: string;
  created_at: string;
};

type SettingsData = {
  rsvpEnabled: boolean;
  rsvpDeadline: string;
  guestbookEnabled: boolean;
  guestbookWriteEnabled: boolean;
  musicEnabled: boolean;
};

type MediaAsset = {
  id: string;
  slot: 'HERO' | 'GALLERY' | 'OG' | 'BGM' | 'EVENT_SECRET' | string;
  object_key: string;
  mime_type: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  object_position?: string | null;
  alt_text?: string | null;
  sort_order?: number | null;
  active: number;
  created_at: string;
};

type MediaData = {
  bucketConfigured: boolean;
  limits?: { imageBytes?: number; audioBytes?: number };
  assets: MediaAsset[];
};

type ContactEntry = {
  id: string;
  label: string;
  name: string;
  phone: string;
};

type AccountEntry = {
  id: string;
  label: string;
  bank: string;
  accountNumber: string;
  holder: string;
};

type ContentData = {
  contactsEnabled: boolean;
  accountsEnabled: boolean;
  contacts: ContactEntry[];
  accounts: {
    groom: AccountEntry[];
    bride: AccountEntry[];
  };
};

type View = 'dashboard' | 'rsvp' | 'guestbook' | 'content' | 'media' | 'event' | 'settings';

const number = (value?: number) => Number(value ?? 0).toLocaleString('ko-KR');
const sideLabel = (value?: string | null) => value === 'GROOM' ? '신랑측' : value === 'BRIDE' ? '신부측' : '-';
const dateLabel = (value: string) => new Date(value).toLocaleString('ko-KR');
const bytesLabel = (value?: number) => {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.error || 'REQUEST_FAILED'));
  return data as T;
}

function toLocalDateTimeValue(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminApp() {
  const [view, setView] = useState<View>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [rsvpItems, setRsvpItems] = useState<RsvpItem[]>([]);
  const [letterItems, setLetterItems] = useState<PrivateLetterItem[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [media, setMedia] = useState<MediaData | null>(null);
  const [eventData, setEventData] = useState<EventAdminData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const loadDashboard = async () => {
    setData(await api<DashboardData>('/api/admin/dashboard', { headers: { accept: 'application/json' } }));
  };

  const loadRsvp = async () => {
    const params = new URLSearchParams({ limit: '500' });
    if (query.trim()) params.set('q', query.trim());
    const payload = await api<{ items: RsvpItem[] }>(`/api/admin/rsvp?${params}`);
    setRsvpItems(payload.items || []);
  };

  const loadLetters = async () => {
    const params = new URLSearchParams({ limit: '500' });
    if (query.trim()) params.set('q', query.trim());
    const payload = await api<{ items: PrivateLetterItem[] }>(`/api/admin/guestbook?${params}`);
    setLetterItems(payload.items || []);
  };

  const loadSettings = async () => setSettings(await api<SettingsData>('/api/admin/settings'));
  const loadContent = async () => setContent(await api<ContentData>('/api/admin/content'));
  const loadMedia = async () => {
    const payload = await api<MediaData>('/api/admin/media');
    setMedia({ ...payload, assets: payload.assets || [] });
  };
  const loadEvent = async () => setEventData(await api<EventAdminData>('/api/admin/event'));

  const load = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (view === 'dashboard') await loadDashboard();
      if (view === 'rsvp') await loadRsvp();
      if (view === 'guestbook') await loadLetters();
      if (view === 'content') await loadContent();
      if (view === 'media') await loadMedia();
      if (view === 'event') await loadEvent();
      if (view === 'settings') await loadSettings();
    } catch {
      setError('관리자 데이터를 불러오지 못했습니다. Cloudflare Access와 D1 연결 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [view]);

  const title = view === 'dashboard' ? '결혼식 운영 현황'
    : view === 'rsvp' ? 'RSVP 응답 관리'
      : view === 'guestbook' ? '비공개 편지함'
        : view === 'content' ? '연락처 · 계좌 관리'
          : view === 'media' ? '미디어 관리'
            : view === 'event' ? 'Wedding Day EVENT 운영'
              : '공개 기능 설정';
  const eyebrow = view === 'dashboard' ? 'OVERVIEW'
    : view === 'rsvp' ? 'RSVP'
      : view === 'guestbook' ? 'PRIVATE LETTERS'
        : view === 'content' ? 'CONTENT'
          : view === 'media' ? 'MEDIA'
            : view === 'event' ? 'HALLOWEEN EVENT'
              : 'SETTINGS';
  const attendingPeople = useMemo(() => rsvpItems.reduce((sum, item) => sum + (item.attendance === 'YES' ? Number(item.guest_count || 0) : 0), 0), [rsvpItems]);

  const rsvpDelete = async (item: RsvpItem) => {
    if (!window.confirm(`${item.name}님의 RSVP 응답을 삭제할까요?`)) return;
    try {
      await api('/api/admin/rsvp', {
        method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: item.id, action: 'DELETE' }),
      });
      await Promise.all([loadRsvp(), loadDashboard()]);
    } catch {
      setError('RSVP 응답을 삭제하지 못했습니다.');
    }
  };

  const letterDelete = async (item: PrivateLetterItem) => {
    if (!window.confirm(`${item.name}님이 남긴 편지를 삭제할까요?`)) return;
    try {
      await api('/api/admin/guestbook', {
        method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: item.id, action: 'DELETE' }),
      });
      await Promise.all([loadLetters(), loadDashboard()]);
    } catch {
      setError('편지를 삭제하지 못했습니다.');
    }
  };

  const moderateEventDrawing = async (item: EventAdminDrawing, action: 'DRAWING_HIDE' | 'DRAWING_SHOW' | 'DRAWING_DELETE') => {
    if (action === 'DRAWING_DELETE' && !window.confirm(`${item.nickname}님의 롤링페이퍼를 삭제할까요?`)) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = await api<EventAdminData>('/api/admin/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: item.id, action }),
      });
      setEventData(payload);
      setNotice(action === 'DRAWING_HIDE' ? '롤링페이퍼를 공개 화면에서 숨겼습니다.' : action === 'DRAWING_SHOW' ? '롤링페이퍼를 다시 공개했습니다.' : '롤링페이퍼를 삭제 처리했습니다.');
      await loadDashboard();
    } catch {
      setError('EVENT 롤링페이퍼 상태를 변경하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const deadline = String(form.get('rsvpDeadline') || '').trim();
    try {
      const payload = await api<SettingsData>('/api/admin/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          updates: {
            rsvp_enabled: form.get('rsvpEnabled') === 'on',
            rsvp_deadline: deadline ? new Date(deadline).toISOString() : '',
            guestbook_enabled: form.get('guestbookEnabled') === 'on',
            guestbook_write_enabled: form.get('guestbookWriteEnabled') === 'on',
            music_enabled: form.get('musicEnabled') === 'on',
          },
        }),
      });
      setSettings(payload);
      setNotice('설정을 저장했습니다. 공개 청첩장에 즉시 반영됩니다.');
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error && err.message === 'INVALID_RSVP_DEADLINE' ? 'RSVP 마감일 형식을 확인해 주세요.' : '설정을 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = await api<ContentData>('/api/admin/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(content),
      });
      setContent(payload);
      setNotice('연락처와 계좌 정보를 저장했습니다. 공개 ON 항목은 청첩장에 반영됩니다.');
      await loadDashboard();
    } catch {
      setError('연락처와 계좌 정보를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateContact = (id: string, phone: string) => {
    setContent((current) => current ? {
      ...current,
      contacts: current.contacts.map((item) => item.id === id ? { ...item, phone } : item),
    } : current);
  };

  const updateAccount = (side: 'groom' | 'bride', id: string, field: 'bank' | 'accountNumber' | 'holder', value: string) => {
    setContent((current) => current ? {
      ...current,
      accounts: {
        ...current.accounts,
        [side]: current.accounts[side].map((item) => item.id === id ? { ...item, [field]: value } : item),
      },
    } : current);
  };

  const uploadMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get('file');
    if (!(file instanceof File) || !file.size) {
      setError('업로드할 파일을 선택해 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/media', { method: 'POST', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.error || 'UPLOAD_FAILED'));
      formElement.reset();
      setMedia((current) => current ? { ...current, assets: payload.assets || current.assets } : current);
      setNotice('미디어를 업로드했습니다.');
      await loadDashboard();
      if (view === 'event') await loadEvent();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setError(code === 'R2_NOT_CONFIGURED' ? 'Cloudflare R2 bucket binding이 아직 연결되지 않았습니다.' : '미디어 업로드에 실패했습니다. 파일 형식과 크기를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const exportRsvpCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['이름', '구분', '참석', '인원', '식사', '전달사항', '등록일'],
      ...rsvpItems.map((item) => [item.name, sideLabel(item.side), item.attendance === 'YES' ? '참석' : '불참', item.guest_count ?? '', item.meal === 'YES' ? '식사 예정' : item.meal === 'NO' ? '식사 안 함' : item.meal === 'UNKNOWN' ? '미정' : '', item.message ?? '', dateLabel(item.created_at)]),
    ];
    const csv = '\ufeff' + rows.map((row) => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wedding-rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><p>WEDDING OPERATIONS</p><h1>승표 & 제희 Admin</h1></div>
        <a href="/">청첩장 보기 ↗</a>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          <button className={view === 'dashboard' ? 'is-active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'rsvp' ? 'is-active' : ''} onClick={() => setView('rsvp')}>RSVP</button>
          <button className={view === 'guestbook' ? 'is-active' : ''} onClick={() => setView('guestbook')}>Letters</button>
          <button className={view === 'content' ? 'is-active' : ''} onClick={() => setView('content')}>Content</button>
          <button className={view === 'media' ? 'is-active' : ''} onClick={() => setView('media')}>Media</button>
          <button className={view === 'event' ? 'is-active' : ''} onClick={() => setView('event')}>Event</button>
          <button className={view === 'settings' ? 'is-active' : ''} onClick={() => setView('settings')}>Settings</button>
          <span>System</span>
        </aside>
        <main className="admin-main">
          <section className="admin-page-title">
            <div><small>{eyebrow}</small><h2>{title}</h2></div>
            <div className="admin-page-actions">
              {(view === 'rsvp' || view === 'guestbook') && <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="이름/내용 검색" />}
              {view === 'rsvp' && <button type="button" onClick={exportRsvpCsv} disabled={!rsvpItems.length}>CSV 내보내기</button>}
              <button type="button" onClick={() => void load()} disabled={loading}>{loading ? '불러오는 중' : '새로고침'}</button>
            </div>
          </section>

          {error && <div className="admin-alert">{error}</div>}
          {notice && <div className="admin-alert admin-alert--success">{notice}</div>}

          {view === 'dashboard' && <>
            <section className="admin-kpis" aria-label="참석 현황 요약">
              <article><small>전체 응답</small><strong>{number(data?.rsvp?.responses)}</strong><span>건</span></article>
              <article><small>예상 참석</small><strong>{number(data?.rsvp?.attending_people)}</strong><span>명</span></article>
              <article><small>불참 응답</small><strong>{number(data?.rsvp?.declined_responses)}</strong><span>건</span></article>
              <article><small>받은 편지</small><strong>{number(data?.guestbook?.total)}</strong><span>건</span></article>
            </section>
            <section className="admin-grid-two">
              <article className="admin-panel"><div className="admin-panel__head"><div><small>RSVP SPLIT</small><h3>양가 예상 참석 인원</h3></div></div><div className="admin-bars"><div><p><span>신랑측</span><strong>{number(data?.rsvp?.groom_people)}명</strong></p><i><b style={{ width: `${Math.min(100, ((data?.rsvp?.groom_people ?? 0) / Math.max(1, data?.rsvp?.attending_people ?? 0)) * 100)}%` }} /></i></div><div><p><span>신부측</span><strong>{number(data?.rsvp?.bride_people)}명</strong></p><i><b style={{ width: `${Math.min(100, ((data?.rsvp?.bride_people ?? 0) / Math.max(1, data?.rsvp?.attending_people ?? 0)) * 100)}%` }} /></i></div></div></article>
              <article className="admin-panel"><div className="admin-panel__head"><div><small>PRIVATE LETTERS</small><h3>두 사람에게 온 편지</h3></div></div><div className="admin-stat-list"><p><span>받은 편지</span><strong>{number(data?.guestbook?.total)}건</strong></p><p><span>식사 예정</span><strong>{number(data?.rsvp?.meal_people)}명</strong></p><p><span>식사 미정</span><strong>{number(data?.rsvp?.meal_unknown_people)}명</strong></p></div></article>
            </section>
            <section className="admin-panel"><div className="admin-panel__head"><div><small>ACTIVITY</small><h3>최근 관리자 작업</h3></div></div>{data?.recentActivity?.length ? <div className="admin-activity">{data.recentActivity.map((item) => <div key={item.id}><time>{dateLabel(item.created_at)}</time><strong>{item.action}</strong><p>{item.summary || '-'}</p></div>)}</div> : <p className="admin-empty">아직 기록된 관리자 작업이 없습니다.</p>}</section>
          </>}

          {view === 'rsvp' && <>
            <section className="admin-kpis admin-kpis--compact"><article><small>조회 응답</small><strong>{number(rsvpItems.length)}</strong><span>건</span></article><article><small>조회 참석 인원</small><strong>{number(attendingPeople)}</strong><span>명</span></article></section>
            <section className="admin-panel admin-table-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>구분</th><th>참석</th><th>인원</th><th>식사</th><th>전달사항</th><th>등록일</th><th></th></tr></thead><tbody>{rsvpItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{sideLabel(item.side)}</td><td>{item.attendance === 'YES' ? '참석' : '불참'}</td><td>{item.attendance === 'YES' ? `${item.guest_count || 0}명` : '-'}</td><td>{item.meal === 'YES' ? '예정' : item.meal === 'NO' ? '안 함' : item.meal === 'UNKNOWN' ? '미정' : '-'}</td><td className="admin-table__message">{item.message || '-'}</td><td>{dateLabel(item.created_at)}</td><td><button className="admin-danger" onClick={() => void rsvpDelete(item)}>삭제</button></td></tr>)}</tbody></table></div>{!rsvpItems.length && <p className="admin-empty">조회된 RSVP 응답이 없습니다.</p>}</section>
          </>}

          {view === 'guestbook' && <section className="admin-panel admin-table-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>보낸 분</th><th>구분</th><th>편지</th><th>받은 시각</th><th></th></tr></thead><tbody>{letterItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{sideLabel(item.side)}</td><td className="admin-table__message admin-table__letter">{item.message}</td><td>{dateLabel(item.created_at)}</td><td><button className="admin-danger" onClick={() => void letterDelete(item)}>삭제</button></td></tr>)}</tbody></table></div>{!letterItems.length && <p className="admin-empty">아직 전달된 비공개 편지가 없습니다.</p>}</section>}

          {view === 'content' && content && <form className="admin-content" onSubmit={saveContent}>
            <section className="admin-panel">
              <div className="admin-panel__head"><div><small>CONTACTS</small><h3>연락처 관리</h3></div></div>
              <label className="admin-toggle"><div><strong>연락처 공개</strong><span>ON이면 입력된 연락처만 청첩장의 연락하기 섹션에 표시합니다.</span></div><input type="checkbox" checked={content.contactsEnabled} onChange={(event) => setContent({ ...content, contactsEnabled: event.target.checked })} /></label>
              <div className="admin-content-list">
                {content.contacts.map((item) => <label className="admin-content-row" key={item.id}><span><small>{item.label}</small><strong>{item.name}</strong></span><input type="tel" value={item.phone} placeholder="010-0000-0000" onChange={(event) => updateContact(item.id, event.target.value)} /></label>)}
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel__head"><div><small>ACCOUNTS</small><h3>계좌 관리</h3></div></div>
              <label className="admin-toggle"><div><strong>계좌 공개</strong><span>ON이면 계좌번호가 입력된 항목만 마음 전하실 곳에 표시합니다.</span></div><input type="checkbox" checked={content.accountsEnabled} onChange={(event) => setContent({ ...content, accountsEnabled: event.target.checked })} /></label>
              {(['groom', 'bride'] as const).map((side) => <div className="admin-account-side" key={side}><h4>{side === 'groom' ? '신랑측' : '신부측'}</h4>{content.accounts[side].map((item) => <div className="admin-account-row" key={item.id}><strong>{item.label}</strong><label><span>은행</span><input value={item.bank} onChange={(event) => updateAccount(side, item.id, 'bank', event.target.value)} placeholder="은행명" /></label><label><span>계좌번호</span><input value={item.accountNumber} onChange={(event) => updateAccount(side, item.id, 'accountNumber', event.target.value)} placeholder="계좌번호" inputMode="numeric" /></label><label><span>예금주</span><input value={item.holder} onChange={(event) => updateAccount(side, item.id, 'holder', event.target.value)} placeholder="예금주" /></label></div>)}</div>)}
            </section>
            <div className="admin-settings-actions"><button type="submit" disabled={saving}>{saving ? '저장 중…' : '연락처 · 계좌 저장'}</button></div>
          </form>}

          {view === 'media' && media && <>
            <section className="admin-panel"><div className="admin-panel__head"><div><small>R2 STORAGE</small><h3>미디어 저장소</h3></div></div><div className="admin-media-status"><strong>{media.bucketConfigured ? 'R2 연결됨' : 'R2 연결 전'}</strong><span>{media.bucketConfigured ? '새 미디어를 업로드할 수 있습니다.' : 'WEDDING_MEDIA R2 binding을 연결하면 업로드가 활성화됩니다.'}</span></div></section>
            <form className="admin-panel admin-media-upload" onSubmit={uploadMedia}><div className="admin-panel__head"><div><small>UPLOAD</small><h3>새 미디어 등록</h3></div></div><div className="admin-media-fields"><label><span>용도</span><select name="slot" defaultValue="HERO"><option value="HERO">Hero 대표사진</option><option value="GALLERY">Gallery 사진</option><option value="OG">공유 OG 이미지</option><option value="EVENT_SECRET">EVENT Secret 사진</option><option value="BGM">BGM 음원</option></select></label><label><span>파일</span><input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/avif,audio/mpeg,audio/mp4,audio/ogg,audio/wav" /></label><label><span>대체 텍스트</span><input type="text" name="altText" maxLength={300} placeholder="사진 설명" /></label><label><span>Object position</span><input type="text" name="objectPosition" maxLength={50} placeholder="예: 50% 40%" /></label><label><span>Gallery / Secret 순서</span><input type="number" name="sortOrder" min="0" max="9999" placeholder="0" /></label></div><div className="admin-settings-actions"><button type="submit" disabled={saving || !media.bucketConfigured}>{saving ? '업로드 중…' : '미디어 업로드'}</button></div></form>
            <section className="admin-panel admin-table-panel"><div className="admin-table-wrap"><table className="admin-table admin-table--media"><thead><tr><th>용도</th><th>상태</th><th>파일</th><th>형식</th><th>크기</th><th>순서</th><th>등록일</th></tr></thead><tbody>{media.assets.map((item) => <tr key={item.id}><td><strong>{item.slot}</strong></td><td>{item.active ? '사용 중' : '이전 버전'}</td><td className="admin-table__message">{item.object_key}</td><td>{item.mime_type}</td><td>{bytesLabel(item.size_bytes)}</td><td>{item.sort_order ?? '-'}</td><td>{dateLabel(item.created_at)}</td></tr>)}</tbody></table></div>{!media.assets.length && <p className="admin-empty">등록된 미디어가 없습니다.</p>}</section>
          </>}

          {view === 'event' && eventData && <EventAdminPanel data={eventData} saving={saving} onModerate={(item, action) => void moderateEventDrawing(item, action)} />}

          {view === 'settings' && settings && <form className="admin-settings" onSubmit={saveSettings}>
            <section className="admin-panel"><div className="admin-panel__head"><div><small>PUBLIC FEATURES</small><h3>공개 기능 제어</h3></div></div><div className="admin-setting-list"><label className="admin-toggle"><div><strong>RSVP 사용</strong><span>공개 청첩장에서 참석 여부 폼을 활성화합니다.</span></div><input type="checkbox" name="rsvpEnabled" checked={settings.rsvpEnabled} onChange={(event) => setSettings({ ...settings, rsvpEnabled: event.target.checked })} /></label><label className="admin-toggle"><div><strong>비공개 편지함 사용</strong><span>하객이 신랑·신부에게만 보이는 편지를 남길 수 있습니다.</span></div><input type="checkbox" name="guestbookEnabled" checked={settings.guestbookEnabled} onChange={(event) => setSettings({ ...settings, guestbookEnabled: event.target.checked })} /></label><label className="admin-toggle"><div><strong>편지 신규 작성</strong><span>기존 편지는 관리자에서 유지하고 새 편지만 마감할 수 있습니다.</span></div><input type="checkbox" name="guestbookWriteEnabled" checked={settings.guestbookWriteEnabled} disabled={!settings.guestbookEnabled} onChange={(event) => setSettings({ ...settings, guestbookWriteEnabled: event.target.checked })} /></label><label className="admin-toggle"><div><strong>BGM 사용</strong><span>실제 음원이 연결된 이후 공개 BGM 사용 여부를 제어합니다.</span></div><input type="checkbox" name="musicEnabled" checked={settings.musicEnabled} onChange={(event) => setSettings({ ...settings, musicEnabled: event.target.checked })} /></label></div></section>
            <section className="admin-panel"><div className="admin-panel__head"><div><small>RSVP DEADLINE</small><h3>RSVP 마감일</h3></div></div><label className="admin-field"><span>마감 일시</span><input type="datetime-local" name="rsvpDeadline" value={toLocalDateTimeValue(settings.rsvpDeadline)} onChange={(event) => setSettings({ ...settings, rsvpDeadline: event.target.value ? new Date(event.target.value).toISOString() : '' })} /><small>비워두면 마감일을 사용하지 않습니다.</small></label></section>
            <div className="admin-settings-actions"><button type="submit" disabled={saving}>{saving ? '저장 중…' : '설정 저장'}</button></div>
          </form>}
        </main>
      </div>
    </div>
  );
}
