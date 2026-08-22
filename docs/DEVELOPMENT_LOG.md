# Wedding Mobile 개발 일지

최종 업데이트: 2026-08-22

## 현재 상태

Cloudflare Workers Production 배포 후 D1, Turnstile, Cloudflare Access, RSVP/Guestbook 관리자 운영 기능까지 실제 환경 검증 완료.

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
- [x] 모바일 Admin table 가로 스크롤 대응
- [x] 실제 Production CRUD/Admin UI 동작 확인

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

### Admin Settings / Operations

관리자에서 D1 `site_settings`를 직접 제어한다.

- [ ] RSVP ON/OFF
- [ ] RSVP 마감일
- [ ] Guestbook 전체 ON/OFF
- [ ] Guestbook 신규 작성 ON/OFF
- [ ] BGM ON/OFF
- [ ] 변경 사항 audit log

완료 후 다음 우선순위는 R2 Media 관리 또는 실제 콘텐츠 입력으로 진행한다.
