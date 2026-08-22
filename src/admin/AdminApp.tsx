import { useEffect, useState } from 'react';

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
  generatedAt?: string;
};

const number = (value?: number) => Number(value ?? 0).toLocaleString('ko-KR');

export default function AdminApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('dashboard failed');
      const payload = await response.json();
      setData(payload);
    } catch {
      setError('관리자 데이터를 불러오지 못했습니다. Cloudflare D1/Access 연결 전에는 정상적인 상태입니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><p>WEDDING OPERATIONS</p><h1>승표 & 제희 Admin</h1></div>
        <a href="/">청첩장 보기 ↗</a>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          <strong>Dashboard</strong>
          <span>RSVP</span><span>Guestbook</span><span>Media</span><span>Settings</span><span>System</span>
        </aside>
        <main className="admin-main">
          <section className="admin-page-title"><div><small>OVERVIEW</small><h2>결혼식 운영 현황</h2></div><button type="button" onClick={() => void load()} disabled={loading}>{loading ? '불러오는 중' : '새로고침'}</button></section>
          {error && <div className="admin-alert">{error}</div>}
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
          <section className="admin-panel admin-readiness"><div className="admin-panel__head"><div><small>READINESS</small><h3>배포 준비 상태</h3></div></div><div className="admin-checks"><span>✓ 디자인 시스템</span><span>✓ 반응형 기반</span><span>✓ RSVP API</span><span>✓ 방명록 API</span><span>○ D1 연결</span><span>○ Access 인증</span><span>○ 실제 사진</span><span>○ 계좌/연락처</span><span>○ BGM</span><span>○ Kakao Share</span></div></section>
          <section className="admin-panel"><div className="admin-panel__head"><div><small>ACTIVITY</small><h3>최근 관리자 작업</h3></div></div>{data?.recentActivity?.length ? <div className="admin-activity">{data.recentActivity.map((item) => <div key={item.id}><time>{new Date(item.created_at).toLocaleString('ko-KR')}</time><strong>{item.action}</strong><p>{item.summary || '-'}</p></div>)}</div> : <p className="admin-empty">아직 기록된 관리자 작업이 없습니다.</p>}</section>
        </main>
      </div>
    </div>
  );
}
