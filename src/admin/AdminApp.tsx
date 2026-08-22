import { useEffect, useMemo, useState } from 'react';

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

type GuestbookItem = {
  id: string;
  name: string;
  side?: 'GROOM' | 'BRIDE' | null;
  message: string;
  visible: number;
  created_at: string;
};

type View = 'dashboard' | 'rsvp' | 'guestbook';

const number = (value?: number) => Number(value ?? 0).toLocaleString('ko-KR');
const sideLabel = (value?: string | null) => value === 'GROOM' ? '신랑측' : value === 'BRIDE' ? '신부측' : '-';
const dateLabel = (value: string) => new Date(value).toLocaleString('ko-KR');

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.error || 'REQUEST_FAILED'));
  return data as T;
}

export default function AdminApp() {
  const [view, setView] = useState<View>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [rsvpItems, setRsvpItems] = useState<RsvpItem[]>([]);
  const [guestbookItems, setGuestbookItems] = useState<GuestbookItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadDashboard = async () => {
    const payload = await api<DashboardData>('/api/admin/dashboard', { headers: { accept: 'application/json' } });
    setData(payload);
  };

  const loadRsvp = async () => {
    const params = new URLSearchParams({ limit: '500' });
    if (query.trim()) params.set('q', query.trim());
    const payload = await api<{ items: RsvpItem[] }>(`/api/admin/rsvp?${params}`);
    setRsvpItems(payload.items || []);
  };

  const loadGuestbook = async () => {
    const params = new URLSearchParams({ limit: '500' });
    if (query.trim()) params.set('q', query.trim());
    const payload = await api<{ items: GuestbookItem[] }>(`/api/admin/guestbook?${params}`);
    setGuestbookItems(payload.items || []);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (view === 'dashboard') await loadDashboard();
      if (view === 'rsvp') await loadRsvp();
      if (view === 'guestbook') await loadGuestbook();
    } catch {
      setError('관리자 데이터를 불러오지 못했습니다. Cloudflare Access와 D1 연결 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [view]);

  const title = view === 'dashboard' ? '결혼식 운영 현황' : view === 'rsvp' ? 'RSVP 응답 관리' : '방명록 관리';
  const eyebrow = view === 'dashboard' ? 'OVERVIEW' : view === 'rsvp' ? 'RSVP' : 'GUESTBOOK';

  const attendingPeople = useMemo(() => rsvpItems.reduce((sum, item) => sum + (item.attendance === 'YES' ? Number(item.guest_count || 0) : 0), 0), [rsvpItems]);

  const rsvpDelete = async (item: RsvpItem) => {
    if (!window.confirm(`${item.name}님의 RSVP 응답을 삭제할까요?`)) return;
    try {
      await api('/api/admin/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: item.id, action: 'DELETE' }),
      });
      await Promise.all([loadRsvp(), loadDashboard()]);
    } catch {
      setError('RSVP 응답을 삭제하지 못했습니다.');
    }
  };

  const guestbookAction = async (item: GuestbookItem, action: 'HIDE' | 'SHOW' | 'DELETE') => {
    if (action === 'DELETE' && !window.confirm(`${item.name}님의 방명록을 삭제할까요?`)) return;
    try {
      await api('/api/admin/guestbook', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: item.id, action }),
      });
      await Promise.all([loadGuestbook(), loadDashboard()]);
    } catch {
      setError('방명록 상태를 변경하지 못했습니다.');
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
          <button className={view === 'guestbook' ? 'is-active' : ''} onClick={() => setView('guestbook')}>Guestbook</button>
          <span>Media</span><span>Settings</span><span>System</span>
        </aside>
        <main className="admin-main">
          <section className="admin-page-title">
            <div><small>{eyebrow}</small><h2>{title}</h2></div>
            <div className="admin-page-actions">
              {view !== 'dashboard' && <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} placeholder="이름/메시지 검색" />}
              {view === 'rsvp' && <button type="button" onClick={exportRsvpCsv} disabled={!rsvpItems.length}>CSV 내보내기</button>}
              <button type="button" onClick={() => void load()} disabled={loading}>{loading ? '불러오는 중' : '새로고침'}</button>
            </div>
          </section>

          {error && <div className="admin-alert">{error}</div>}

          {view === 'dashboard' && <>
            <section className="admin-kpis" aria-label="참석 현황 요약">
              <article><small>전체 응답</small><strong>{number(data?.rsvp?.responses)}</strong><span>건</span></article>
              <article><small>예상 참석</small><strong>{number(data?.rsvp?.attending_people)}</strong><span>명</span></article>
              <article><small>불참 응답</small><strong>{number(data?.rsvp?.declined_responses)}</strong><span>건</span></article>
              <article><small>식사 예정</small><strong>{number(data?.rsvp?.meal_people)}</strong><span>명</span></article>
            </section>
            <section className="admin-grid-two">
              <article className="admin-panel"><div className="admin-panel__head"><div><small>RSVP SPLIT</small><h3>양가 예상 참석 인원</h3></div></div><div className="admin-bars"><div><p><span>신랑측</span><strong>{number(data?.rsvp?.groom_people)}명</strong></p><i><b style={{ width: `${Math.min(100, ((data?.rsvp?.groom_people ?? 0) / Math.max(1, data?.rsvp?.attending_people ?? 0)) * 100)}%` }} /></i></div><div><p><span>신부측</span><strong>{number(data?.rsvp?.bride_people)}명</strong></p><i><b style={{ width: `${Math.min(100, ((data?.rsvp?.bride_people ?? 0) / Math.max(1, data?.rsvp?.attending_people ?? 0)) * 100)}%` }} /></i></div></div></article>
              <article className="admin-panel"><div className="admin-panel__head"><div><small>GUESTBOOK</small><h3>방명록 상태</h3></div></div><div className="admin-stat-list"><p><span>등록 글</span><strong>{number(data?.guestbook?.total)}건</strong></p><p><span>숨김 글</span><strong>{number(data?.guestbook?.hidden)}건</strong></p><p><span>식사 미정</span><strong>{number(data?.rsvp?.meal_unknown_people)}명</strong></p></div></article>
            </section>
            <section className="admin-panel"><div className="admin-panel__head"><div><small>ACTIVITY</small><h3>최근 관리자 작업</h3></div></div>{data?.recentActivity?.length ? <div className="admin-activity">{data.recentActivity.map((item) => <div key={item.id}><time>{dateLabel(item.created_at)}</time><strong>{item.action}</strong><p>{item.summary || '-'}</p></div>)}</div> : <p className="admin-empty">아직 기록된 관리자 작업이 없습니다.</p>}</section>
          </>}

          {view === 'rsvp' && <>
            <section className="admin-kpis admin-kpis--compact">
              <article><small>조회 응답</small><strong>{number(rsvpItems.length)}</strong><span>건</span></article>
              <article><small>조회 참석 인원</small><strong>{number(attendingPeople)}</strong><span>명</span></article>
            </section>
            <section className="admin-panel admin-table-panel">
              <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>구분</th><th>참석</th><th>인원</th><th>식사</th><th>전달사항</th><th>등록일</th><th></th></tr></thead><tbody>{rsvpItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{sideLabel(item.side)}</td><td>{item.attendance === 'YES' ? '참석' : '불참'}</td><td>{item.attendance === 'YES' ? `${item.guest_count || 0}명` : '-'}</td><td>{item.meal === 'YES' ? '예정' : item.meal === 'NO' ? '안 함' : item.meal === 'UNKNOWN' ? '미정' : '-'}</td><td className="admin-table__message">{item.message || '-'}</td><td>{dateLabel(item.created_at)}</td><td><button className="admin-danger" onClick={() => void rsvpDelete(item)}>삭제</button></td></tr>)}</tbody></table></div>
              {!rsvpItems.length && <p className="admin-empty">조회된 RSVP 응답이 없습니다.</p>}
            </section>
          </>}

          {view === 'guestbook' && <section className="admin-panel admin-table-panel">
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>구분</th><th>메시지</th><th>상태</th><th>등록일</th><th></th></tr></thead><tbody>{guestbookItems.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{sideLabel(item.side)}</td><td className="admin-table__message">{item.message}</td><td>{item.visible ? '공개' : '숨김'}</td><td>{dateLabel(item.created_at)}</td><td><div className="admin-row-actions"><button onClick={() => void guestbookAction(item, item.visible ? 'HIDE' : 'SHOW')}>{item.visible ? '숨김' : '공개'}</button><button className="admin-danger" onClick={() => void guestbookAction(item, 'DELETE')}>삭제</button></div></td></tr>)}</tbody></table></div>
            {!guestbookItems.length && <p className="admin-empty">조회된 방명록이 없습니다.</p>}
          </section>}
        </main>
      </div>
    </div>
  );
}
