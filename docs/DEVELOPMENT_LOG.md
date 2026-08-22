# Wedding Mobile 개발 일지

최종 업데이트: 2026-08-22

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

### 2026-08-22 — Admin 모바일 테이블 overflow 이슈

- [x] Chrome DevTools 모바일 device frame에서 Admin RSVP/Guestbook 진입 시 페이지 전체가 viewport보다 가로로 확장되는 현상 확인
- 원인: RSVP/Guestbook 테이블이 `min-width: 860px`를 사용하고 있으며, CSS Grid/Flex 자식의 기본 `min-width:auto` 때문에 table wrapper 내부 스크롤로 제한되지 않고 상위 layout의 최소 너비를 밀어냄
- [x] 수정 방향: `.admin-layout`, `.admin-main`, `.admin-panel`, `.admin-table-panel`, `.admin-table-wrap` 등에 `min-width:0` / `max-width:100%` 적용
- [x] 모바일에서는 table 자체의 860px 최소 너비는 유지하되 `.admin-table-wrap`에서만 가로 스크롤하도록 containment 적용
- [x] `.admin-shell`의 비의도적 페이지 전체 horizontal overflow 방지
- [~] Production 배포 후 320 / 344 / 360 / 375 / 390 / 393 / 412 / 430px 재검증 필요

### 확인된 Backlog

- [ ] 모바일 브라우저 강제 Dark Mode 대응
- [ ] 실제 Kakao Map SDK 적용
- [ ] RSVP 상세 필터/수정/restore/pagination
- [ ] Guestbook restore/CSV export
- [ ] Preview Worker와 Preview D1 완전 분리
- [ ] R2 Media 관리
- [ ] 실제 웨딩 사진/연락처/계좌/BGM 입력
- [ ] Kakao Share Production 설정 및 OG 이미지
- [ ] custom domain
- [ ] 최종 Android/iOS/Kakao 인앱 QA

## 다음 개발

### R2 Media 관리

관리자에서 실제 사진/공유 이미지/BGM을 교체할 수 있도록 Cloudflare R2 기반 media layer를 구축한다.

1. R2 Production/Preview bucket 설계 및 binding
2. `media_assets`와 R2 object key 연결
3. Admin Media 목록/현재 상태 조회 API
4. 업로드 API의 MIME/크기/종류 validation
5. Hero/Gallery/OG/BGM 업로드 및 교체
6. Gallery 순서 및 focal point 관리
7. 기존 object의 안전한 비활성/교체 정책
8. 변경 audit log

R2 binding 전에도 코드 레벨의 API/UI 기반과 object-key 정책부터 구현 가능하다.
