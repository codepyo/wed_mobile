export type EventAdminSession = {
  id: string;
  nickname: string;
  side: 'GROOM' | 'BRIDE';
  cheer_count: number;
  entered_at: string;
  last_activity_at: string;
};

export type EventAdminDrawing = {
  id: string;
  session_id: string;
  nickname: string;
  side: 'GROOM' | 'BRIDE';
  caption?: string | null;
  visible: number;
  status: 'ACTIVE' | 'DELETED' | string;
  created_at: string;
  updated_at: string;
};

export type EventAdminData = {
  summary: {
    sessions: number;
    groomSessions: number;
    brideSessions: number;
    globalCheer: number;
    sessionCheers: number;
    drawings: number;
    visibleDrawings: number;
    secretAssets: number;
  };
  sessions: EventAdminSession[];
  drawings: EventAdminDrawing[];
  generatedAt?: string;
};

type Props = {
  data: EventAdminData;
  saving: boolean;
  onModerate: (drawing: EventAdminDrawing, action: 'DRAWING_HIDE' | 'DRAWING_SHOW' | 'DRAWING_DELETE') => void;
};

const number = (value?: number) => Number(value || 0).toLocaleString('ko-KR');
const sideLabel = (value?: string) => value === 'GROOM' ? '신랑측' : value === 'BRIDE' ? '신부측' : '-';
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString('ko-KR') : '-';

export default function EventAdminPanel({ data, saving, onModerate }: Props) {
  const summary = data.summary || {} as EventAdminData['summary'];
  const totalSides = Math.max(1, Number(summary.sessions || 0));
  const groomRatio = Math.min(100, (Number(summary.groomSessions || 0) / totalSides) * 100);
  const brideRatio = Math.min(100, (Number(summary.brideSessions || 0) / totalSides) * 100);

  return (
    <div className="admin-event-view">
      <section className="admin-event-kpis" aria-label="Wedding Event 운영 현황">
        <article><small>EVENT 입장</small><strong>{number(summary.sessions)}</strong><span>sessions</span></article>
        <article><small>전체 CHEER</small><strong>{number(summary.globalCheer)}</strong><span>taps</span></article>
        <article><small>롤링페이퍼</small><strong>{number(summary.drawings)}</strong><span>cards</span></article>
        <article className={summary.secretAssets ? 'is-ready' : ''}><small>SECRET PHOTO</small><strong>{number(summary.secretAssets)}</strong><span>{summary.secretAssets ? 'ready' : 'not uploaded'}</span></article>
      </section>

      <section className="admin-grid-two">
        <article className="admin-panel">
          <div className="admin-panel__head"><div><small>GUEST SIDE</small><h3>EVENT 입장 구분</h3></div></div>
          <div className="admin-bars">
            <div><p><span>신랑측</span><strong>{number(summary.groomSessions)}명</strong></p><i><b style={{ width: `${groomRatio}%` }} /></i></div>
            <div><p><span>신부측</span><strong>{number(summary.brideSessions)}명</strong></p><i><b style={{ width: `${brideRatio}%` }} /></i></div>
          </div>
        </article>
        <article className="admin-panel">
          <div className="admin-panel__head"><div><small>EVENT HEALTH</small><h3>당일 운영 체크</h3></div></div>
          <div className="admin-stat-list">
            <p><span>보이는 낙서</span><strong>{number(summary.visibleDrawings)}건</strong></p>
            <p><span>Session CHEER 합계</span><strong>{number(summary.sessionCheers)}회</strong></p>
            <p><span>Secret Photo</span><strong>{summary.secretAssets ? '준비됨' : '미등록'}</strong></p>
          </div>
          {!summary.secretAssets && <p className="admin-event-hint">Media에서 `EVENT SECRET` 사진을 등록하면 5 CHEERS 해금 영역에 자동 연결됩니다.</p>}
        </article>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__head"><div><small>LIVE SESSIONS</small><h3>최근 EVENT 입장</h3></div><span className="admin-event-count">최근 {Math.min(200, data.sessions.length)}건</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>닉네임</th><th>구분</th><th>CHEER</th><th>입장</th><th>최근 활동</th></tr></thead><tbody>{data.sessions.map((item) => <tr key={item.id}><td><strong>{item.nickname}</strong></td><td>{sideLabel(item.side)}</td><td>{number(item.cheer_count)}</td><td>{dateLabel(item.entered_at)}</td><td>{dateLabel(item.last_activity_at)}</td></tr>)}</tbody></table></div>
        {!data.sessions.length && <p className="admin-empty">아직 EVENT 입장 기록이 없습니다. 테이블은 준비된 상태입니다.</p>}
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel__head"><div><small>ROLLING PAPER</small><h3>낙서 관리</h3></div><span className="admin-event-count">최대 최근 200건</span></div>
        <div className="admin-table-wrap"><table className="admin-table admin-event-drawing-table"><thead><tr><th>보낸 분</th><th>구분</th><th>한 줄</th><th>상태</th><th>등록일</th><th></th></tr></thead><tbody>{data.drawings.map((item) => {
          const deleted = item.status === 'DELETED';
          const visible = !deleted && Number(item.visible) === 1;
          return <tr key={item.id} className={deleted ? 'is-deleted' : ''}><td><strong>{item.nickname}</strong></td><td>{sideLabel(item.side)}</td><td className="admin-table__message">{item.caption || '(그림만 남김)'}</td><td>{deleted ? '삭제됨' : visible ? '공개 중' : '숨김'}</td><td>{dateLabel(item.created_at)}</td><td><div className="admin-event-actions">{!deleted && <button type="button" disabled={saving} onClick={() => onModerate(item, visible ? 'DRAWING_HIDE' : 'DRAWING_SHOW')}>{visible ? '숨김' : '복원'}</button>}{!deleted && <button type="button" className="admin-danger" disabled={saving} onClick={() => onModerate(item, 'DRAWING_DELETE')}>삭제</button>}</div></td></tr>;
        })}</tbody></table></div>
        {!data.drawings.length && <p className="admin-empty">아직 등록된 롤링페이퍼가 없습니다.</p>}
      </section>
    </div>
  );
}
