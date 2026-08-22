# 구현 진행 현황

기준 문서:

- `docs/DEVELOPMENT_PLAN.md`
- `docs/ADMIN_CONSOLE_PLAN.md`

최종 업데이트: 2026-08-22

표기:

- `[x]` 코드 구현 완료
- `[~]` 코드 기반 구현 완료, 실제 데이터/Cloudflare 설정 또는 실기기 검증 필요
- `[ ]` 미구현

---

## Phase 1 — 디자인 리뉴얼 / 코드 정리

- [x] Orange UI 제거
- [x] Warm Ivory / Ink Black / Charcoal color token 재정의
- [x] Hero 레이아웃 재설계
- [x] 이름/사진 overlap 제거
- [x] production-safe photo placeholder 적용
- [x] Gallery 최종 사용자 문구 적용
- [x] Section typography 통일
- [x] App.tsx section component 분리
- [x] CSS를 global / features / forms / admin 역할로 분리 시작
- [~] 실제 웨딩 사진 적용 후 최종 미세 색보정

## Phase 2 — Responsive

- [x] `viewport-fit=cover`
- [x] safe-area 기반 Hero / Toast / Lightbox spacing
- [x] fluid gutter / section spacing / typography에 `clamp()` 적용
- [x] 주요 사진 `aspect-ratio` 기반 전환
- [x] 사진별 `object-position` data model
- [x] 320px 이하 대응 media query
- [x] 520px 이상 중앙 canvas
- [x] form input 16px 적용
- [x] `svh` / `dvh` 사용
- [x] `prefers-reduced-motion` 대응
- [~] 320 / 344 / 360 / 375 / 390 / 393 / 412 / 430 실기기/DevTools QA
- [~] iOS Safari / Samsung Internet / Kakao 인앱 브라우저 QA

## Phase 3 — 기본 완성 기능

- [~] 연락처 UI/전화/문자 기능 완료, 실제 신랑/신부/혼주 번호 입력 필요
- [x] `.ics` 캘린더 일정 추가
- [x] Gallery lightbox
- [x] Gallery 이전/다음/ESC keyboard control
- [~] 지도: 외부 카카오맵/네이버지도 + 위치 UI 완료, 실제 Kakao Map SDK embedding 미구현
- [x] 주소 복사
- [~] 계좌 accordion / 신랑·신부측 분리 / 개별 복사 완료, 실제 계좌 데이터 입력 필요
- [x] URL 복사
- [x] Native Web Share fallback
- [~] KakaoTalk Share SDK 코드 연결 완료, Kakao JavaScript Key / 등록 도메인 / OG 이미지 필요
- [ ] TMAP production deep link 검증/추가

## Phase 4 — Dynamic / Serverless

- [x] D1 schema: RSVP
- [x] D1 schema: Guestbook
- [x] D1 schema: site_settings
- [x] D1 schema: media_assets
- [x] D1 schema: admin_audit_log
- [x] `POST /api/rsvp` validation / insert
- [x] `GET /api/guestbook`
- [x] `POST /api/guestbook`
- [x] RSVP frontend form
- [x] Guestbook frontend form/list
- [~] RSVP/Guestbook feature flag: Cloudflare D1 연결 전 OFF 유지
- [~] Turnstile client widget + server Siteverify 구현 완료, 실제 site/secret key 설정 필요
- [x] Guestbook 사용자 삭제 endpoint/UI + soft delete
- [x] RSVP deadline server enforcement / frontend closed state
- [x] public `GET /api/site-config`

## Phase 5 — Media / Sharing

- [~] BGM controller 구현 완료, 실제 음원 파일 입력 필요
- [ ] 실제 BGM 연결
- [~] Kakao JavaScript SDK 2.8.2 loader 구현 완료, JavaScript Key/도메인 설정 필요
- [~] KakaoTalk feed share 구조 구현 완료, 실제 OG/Hero 이미지 필요
- [ ] `og:image` 최종 URL 적용
- [ ] 전용 OG 이미지

## Admin Phase A — Backend Foundation

- [x] Admin architecture 문서
- [x] D1 운영 schema
- [x] Admin/Public API 경계 시작
- [x] `GET /api/admin/dashboard` KPI API
- [x] `/admin` frontend route 기반
- [x] responsive Admin Dashboard scaffold
- [ ] 실제 D1 생성 / binding
- [ ] Preview / Production DB 분리
- [ ] R2 bucket 생성 / binding

## Admin Phase B — Authentication

- [ ] Cloudflare Access 설치/설정
- [ ] `/admin*` 보호
- [ ] `/api/admin/*` 보호
- [ ] 관리자 이메일 allow policy
- [ ] unauthorized 테스트

## Admin Phase C — Dashboard / RSVP

- [x] Dashboard KPI UI 기반
- [x] 신랑측/신부측 예상 참석 bar
- [x] Guestbook 상태 KPI
- [x] readiness UI 기반
- [x] recent activity UI 기반
- [ ] RSVP 목록 API/UI
- [ ] RSVP 검색/필터
- [ ] RSVP 수정
- [ ] RSVP soft delete/restore
- [ ] RSVP CSV export

## Admin Phase D — Guestbook

- [ ] Guestbook 관리자 목록
- [ ] 검색
- [ ] hide/show
- [ ] soft delete/restore
- [ ] CSV export

## Admin Phase E — Media

- [ ] R2 upload API
- [ ] Hero/Gallery preview/replace
- [ ] Gallery reorder
- [ ] focal point editor
- [ ] OG 관리
- [ ] BGM 관리

## Admin Phase F — Settings / Operations

- [ ] Feature toggle
- [ ] RSVP deadline Admin UI
- [ ] Guestbook write toggle Admin UI
- [x] readiness UI 기반
- [ ] system status API/UI
- [~] Audit log schema/UI 기반, mutation logging 추가 필요

## Admin Phase G — Backup / QA

- [ ] CSV backup
- [ ] D1 Time Travel 운영 절차 실제 검증
- [ ] Preview DB 테스트
- [ ] mobile admin QA
- [ ] Access bypass/security QA

## Engineering / CI

- [x] Windows `npm run build` 성공 확인
- [x] GitHub Actions Node 24 build workflow 추가
- [x] 최신 공개 기능 변경분 GitHub Actions CI 성공
- [ ] dependency version pinning
- [ ] `package-lock.json` commit
- [ ] Cloudflare preview deployment

---

## 현재 외부 정보/설정이 필요한 항목

아래 항목은 코드만으로 최종 완료할 수 없다.

1. 실제 웨딩 사진
2. 신랑/신부 및 필요 시 혼주 전화번호
3. 계좌 정보
4. BGM 파일 및 공개 사용 권리
5. Cloudflare 계정에서 D1/R2/Pages/Access 설정
6. Turnstile Site Key / Secret Key
7. Kakao Developers JavaScript Key 및 최종 production domain
8. 최종 custom domain

위 값이 없어도 나머지 관리자 구조와 UI/API 개발은 계속 진행한다.
