# Wedding Mobile 개발 일지

최종 업데이트: 2026-08-23

## 현재 상태

Cloudflare Workers Production 배포 후 D1, Turnstile, Cloudflare Access, RSVP/Guestbook 관리자 운영 기능, Admin Settings까지 실제 환경 검증 완료.

Production: `https://wed-mobile.robin5544.workers.dev`

## 2026-08-22 — Production / D1 / Turnstile / Admin

### Cloudflare Workers 배포

- [x] GitHub `main` 기반 Workers 자동 build/deploy
- [x] Vite 정적 자산 + Pages Functions worker bundle 통합
- [x] `/api/*` worker-first 라우팅
- [x] SPA fallback으로 `/admin` 직접 접근/새로고침 정상

### D1

- [x] Production DB `wedding-db-production` 생성
- [x] Preview DB `wedding-db-preview` 생성
- [x] `database/schema.sql` 양쪽 적용
- [x] Production `WEDDING_DB` binding 연결
- [x] `site_settings`, `rsvp`, `guestbook`, `media_assets`, `admin_audit_log` 테이블 확인
- [x] `/api/site-config` Production 조회 검증
- [x] RSVP INSERT 검증
- [x] Guestbook INSERT/조회/사용자 삭제 검증
- [x] 한글 UTF-8 저장 검증

### Turnstile

- [x] Production Turnstile widget 생성
- [x] Build variable `VITE_TURNSTILE_SITE_KEY` 연결
- [x] Runtime secret `TURNSTILE_SECRET_KEY` 연결
- [x] `/api/site-config`의 `turnstileEnabled=true` 확인
- [x] RSVP action=`rsvp` Siteverify 성공
- [x] Guestbook action=`guestbook` Siteverify 성공
- [x] token 미발급 상태 제출 차단
- [x] expired/timeout/error 상태 처리 및 진단 UI 추가
- [x] 실제 브라우저에서 `보안 확인이 완료되었습니다.` 확인

### 공개 RSVP / Guestbook

- [x] RSVP feature flag 활성화
- [x] Guestbook feature flag 활성화
- [x] RSVP 실제 등록 및 D1 저장 확인
- [x] Guestbook 실제 등록 및 공개 목록 반영 확인
- [x] React async submit 이후 `event.currentTarget.reset()` 예외 수정
- [x] 성공 저장 후 UI에서 실패로 보이던 문제 수정

### Cloudflare Access

- [x] Zero Trust Free 조직 구성
- [x] Self-hosted Access Application 생성
- [x] `wed-mobile.robin5544.workers.dev/admin*` 보호
- [x] `wed-mobile.robin5544.workers.dev/api/admin/*` 보호
- [x] 동일 Application 안에 두 destination 구성
- [x] Wedding Admin Allow 정책 적용
- [x] cookie path attribute OFF 확인
- [x] `/api/admin/dashboard` 인증 후 JSON 정상 응답 확인
- [x] `/admin` Admin UI 정상 조회 확인

### Admin Dashboard / RSVP / Guestbook

- [x] Dashboard KPI
- [x] 신랑측/신부측 예상 참석 인원
- [x] 방명록 상태 KPI
- [x] 최근 관리자 작업 audit 표시
- [x] RSVP 목록
- [x] RSVP 검색
- [x] RSVP 삭제
- [x] RSVP UTF-8 BOM CSV export
- [x] Guestbook 목록
- [x] Guestbook 검색
- [x] Guestbook hide/show
- [x] Guestbook 삭제
- [x] Admin mutation audit log 기록
- [x] 실제 Production CRUD/Admin UI 동작 확인

### Admin Settings / Operations

- [x] RSVP ON/OFF
- [x] RSVP 마감 일시 설정
- [x] Guestbook 전체 ON/OFF
- [x] Guestbook 신규 작성 ON/OFF
- [x] BGM ON/OFF
- [x] D1 `site_settings` 즉시 반영
- [x] 설정 변경 `SETTINGS_UPDATE` audit log 기록
- [x] Dashboard 최근 관리자 작업 반영 확인
- [x] 실제 Production 저장/조회 동작 검증

## 2026-08-23 — Admin 모바일 레이아웃 안정화

### 가로 overflow

- [x] Chrome DevTools 모바일 device frame에서 RSVP/Guestbook 진입 시 페이지 전체가 viewport보다 가로로 확장되는 현상 확인
- 원인: 넓은 관리자 테이블(`min-width: 860px`)과 CSS Grid/Flex 자식의 기본 `min-width:auto` 조합으로 상위 layout의 최소 너비가 밀려남
- [x] `.admin-layout`, `.admin-main`, `.admin-panel`, `.admin-table-panel`, `.admin-table-wrap`에 `min-width:0` / `max-width:100%` containment 적용
- [x] 페이지 전체는 viewport에 고정하고 table wrapper 내부에서만 좌우 스크롤하도록 수정
- [x] Production 배포 후 가로 overflow 개선 확인

### RSVP/Guestbook 진입 시 세로로 길게 늘어나는 현상

- [x] 모바일 device frame에서 RSVP/Guestbook 탭 진입 시 화면이 지나치게 세로로 길어지는 현상 추가 확인
- 원인 1: 목록 API를 최대 500건까지 한 번에 받아 모든 행을 DOM에 렌더링하는 구조
- 원인 2: 모바일 admin table에 세로 높이 제한이 없어 row 수만큼 페이지 전체 높이가 증가
- [x] table wrapper에 `max-height` + 내부 `overflow:auto`를 적용해 목록 스크롤을 페이지 전체와 분리
- [x] 모바일 상단 Admin navigation을 56px 고정 높이, 각 메뉴를 40px 고정 높이로 보정해 active 탭이 세로로 늘어나지 않도록 처리
- [~] 장기 개선: RSVP/Guestbook server-side pagination 또는 cursor pagination 적용 예정
- [~] Production에서 320 / 344 / 360 / 375 / 390 / 393 / 412 / 430px 재검증 필요

## 2026-08-23 — R2 Media 기반

- [x] Production R2 bucket `wedding-media-production` 생성
- [x] Preview R2 bucket `wedding-media-preview` 생성
- [x] Worker binding `WEDDING_MEDIA`를 `wrangler.jsonc`에 추가
- [x] Production bucket과 Preview bucket을 분리 설정
- [x] Admin Media 메뉴
- [x] `media_assets` 목록 API
- [x] R2 연결 상태 표시
- [x] Hero / Gallery / OG / BGM 업로드 API 기반
- [x] MIME / 파일 크기 validation
- [x] R2 upload 후 D1 실패 시 object rollback
- [x] Media 업로드 audit log
- [ ] Production 배포 후 `WEDDING_MEDIA` binding 인식 확인
- [ ] 실제 Hero/Gallery/OG/BGM 업로드 검증
- [ ] 공개 청첩장에서 active media asset 사용
- [ ] Gallery reorder / focal point editor
- [ ] 기존 파일 비활성/삭제 정책

### 확인된 Backlog

- [ ] 모바일 브라우저 강제 Dark Mode 대응
- [ ] 실제 Kakao Map SDK 적용
- [ ] RSVP 상세 필터/수정/restore/server-side pagination
- [ ] Guestbook restore/CSV export/server-side pagination
- [ ] Preview Worker와 Preview D1/R2 완전 분리 검증
- [~] R2 Media 관리 구현 진행 중
- [ ] 실제 웨딩 사진/연락처/계좌/BGM 입력
- [ ] Kakao Share Production 설정 및 OG 이미지
- [ ] custom domain
- [ ] 최종 Android/iOS/Kakao 인앱 QA

## 다음 개발

R2 Media PR을 Production 배포한 뒤 Admin Media에서 실제 파일 업로드를 검증하고, 다음으로 공개 청첩장이 D1 `media_assets`의 active asset을 읽어 Hero/Gallery/OG/BGM에 반영하도록 연결한다.
