# 구현 진행 현황

기준 문서:

- `docs/DEVELOPMENT_PLAN.md`
- `docs/ADMIN_CONSOLE_PLAN.md`

최종 업데이트: 2026-08-22
현재 단계: **1차 개발 완료 / Cloudflare Preview 배포 직전 체크포인트**

표기:

- `[x]` 코드 구현 완료
- `[~]` 코드 기반 구현 완료, 실제 데이터/Cloudflare 설정 또는 실기기 검증 필요
- `[ ]` 미구현 / 배포 이후 개발 예정

---

# 0. 배포 전 체크포인트

현재 브랜치 `feat/initial-wedding-invitation`은 로컬 Windows 환경에서 `npm run build` 성공이 확인되었고, GitHub Actions Node 24 CI도 최신 공개 기능 변경분까지 성공했다.

이번 시점부터는 기능을 더 많이 추가하기보다 **현재 상태를 Cloudflare Preview로 먼저 배포하여 실제 모바일 브라우저/네트워크/Cloudflare Functions 환경에서 검증한 뒤 다음 개발을 진행한다.**

배포 전 의도적으로 비활성 상태로 유지하는 기능:

- RSVP: Cloudflare D1 연결 전 `false`
- Guestbook: Cloudflare D1 연결 전 `false`
- Contact: 실제 전화번호 입력 전 숨김
- Account: 실제 계좌정보 입력 전 숨김
- BGM: 실제 음원 입력 전 숨김
- Kakao Share: JavaScript Key/등록 도메인/대표 이미지가 없으면 Native Share 또는 URL 복사 fallback

즉 첫 Preview 배포의 목적은 **공개 청첩장 UI/UX/반응형/라우팅/정적 자산/Cloudflare 빌드 환경 검증**이며, 실제 데이터 저장 기능은 D1 binding 이후 순차 활성화한다.

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
- [~] 320 / 344 / 360 / 375 / 390 / 393 / 412 / 430 Preview/실기기 QA
- [~] iOS Safari / Android Chrome / Samsung Internet / Kakao 인앱 브라우저 QA

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

- [ ] Cloudflare Access 설정
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

- [ ] Feature toggle Admin UI
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
- [ ] Cloudflare Preview deployment
- [ ] Cloudflare production deployment
- [ ] custom domain 연결

---

# 배포 이후 개발 필요사항 — 우선순위 Backlog

아래 순서를 **Preview 배포 후 실제 화면과 Cloudflare 환경을 확인하면서 진행**한다.

## P0 — Preview 배포 직후 반드시 확인

- [ ] Cloudflare Pages에서 feature branch Preview build 성공
- [ ] `/` 직접 접근 정상
- [ ] `/admin` 직접 접근 및 새로고침 라우팅 정상
- [ ] 정적 CSS/font/image 경로 정상
- [ ] HTTPS 환경 Clipboard / Web Share 동작 확인
- [ ] 모바일 실제 스크롤/viewport/safe-area 확인
- [ ] Chrome DevTools 320/344/360/375/390/393/412/430px 확인
- [ ] 실제 Android Chrome 확인
- [ ] 가능하면 iPhone Safari 확인
- [ ] KakaoTalk 인앱 브라우저 확인
- [ ] console error / network 404 확인
- [ ] Lighthouse 또는 동등 수준으로 CLS/LCP/기본 접근성 확인

Preview에서 발견되는 UI/반응형 문제는 다른 기능보다 우선 수정한다.

## P1 — Cloudflare 데이터 기능 연결

- [ ] Preview용 D1 `wedding-db-preview` 생성
- [ ] Production용 D1 `wedding-db-production` 생성
- [ ] `database/schema.sql` 적용
- [ ] Pages Functions의 `WEDDING_DB` binding
- [ ] Preview RSVP 활성화 후 저장/조회 테스트
- [ ] Preview Guestbook 활성화 후 등록/조회/삭제 테스트
- [ ] `/api/site-config` 실제 D1 설정 반영 확인
- [ ] RSVP deadline 실제 테스트
- [ ] DB 오류 시 공개 청첩장 graceful degradation 확인

## P2 — 보안 / Bot 방지

- [ ] Cloudflare Turnstile widget 생성
- [ ] `VITE_TURNSTILE_SITE_KEY` 설정
- [ ] `TURNSTILE_SECRET_KEY` 설정
- [ ] RSVP Siteverify 테스트
- [ ] Guestbook Siteverify 테스트
- [ ] 잘못된/만료된 token 차단 확인
- [ ] 반복 submit / abuse 기본 대응 확인

## P3 — 관리자 핵심 데이터 관리

### RSVP

- [ ] `/admin/rsvp` 목록
- [ ] pagination / cursor
- [ ] 이름 검색
- [ ] 신랑측/신부측 필터
- [ ] 참석/불참 필터
- [ ] 식사 필터
- [ ] 상세 조회
- [ ] 수정
- [ ] soft delete
- [ ] restore
- [ ] 동일 이름 중복 가능성 표시
- [ ] UTF-8 BOM CSV export
- [ ] 현재 필터 CSV export

### Guestbook

- [ ] `/admin/guestbook` 목록
- [ ] 검색
- [ ] 공개/숨김 필터
- [ ] hide/show
- [ ] soft delete
- [ ] restore
- [ ] CSV export

## P4 — 관리자 인증

- [ ] Cloudflare Access Application 생성
- [ ] `/admin*` 보호
- [ ] `/api/admin/*` 보호
- [ ] 허용 관리자 이메일 등록
- [ ] 관리자 인증 header/server 검증
- [ ] 로그인하지 않은 브라우저에서 admin API 직접 호출 차단
- [ ] Access bypass/security QA

관리자 기능을 실제 개인정보 운영에 사용하기 전 P4는 반드시 완료한다.

## P5 — Admin Settings / Audit / Operations

- [ ] RSVP ON/OFF
- [ ] RSVP 마감일 변경
- [ ] Guestbook 전체 ON/OFF
- [ ] Guestbook 신규 작성 ON/OFF
- [ ] BGM ON/OFF
- [ ] 설정 변경 Audit Log
- [ ] RSVP 수정/삭제/복원 Audit Log
- [ ] Guestbook hide/delete/restore Audit Log
- [ ] 최근 활동 실제 데이터 연결
- [ ] System Status API/UI
- [ ] 배포 준비상태 실제 config 기반 계산

## P6 — R2 Media 관리

- [ ] R2 Preview/Production bucket 또는 prefix 설계
- [ ] R2 binding
- [ ] Hero 업로드/교체
- [ ] Gallery 업로드/교체
- [ ] Gallery 순서 변경
- [ ] 사진 focal point editor
- [ ] OG 이미지 교체
- [ ] BGM 업로드/교체
- [ ] MIME / 파일 크기 validation
- [ ] cache busting/versioned object key
- [ ] 기존 파일 안전한 비활성/삭제 정책

## P7 — 실제 콘텐츠 입력

- [ ] Hero 실제 사진
- [ ] Gallery 실제 사진
- [ ] 사진 WebP/AVIF 최적화
- [ ] 사진별 crop/focal point 최종 조정
- [ ] 신랑 전화번호
- [ ] 신부 전화번호
- [ ] 필요한 혼주 전화번호
- [ ] 신랑측 계좌
- [ ] 신부측 계좌
- [ ] 필요한 혼주 계좌
- [ ] BGM 음원
- [ ] 음원 공개 사용 권리 확인
- [ ] 실제 사진 기준 전체 palette 미세 조정

## P8 — Kakao / 공유 / OG

- [ ] Kakao Developers 앱 설정
- [ ] JavaScript Key 설정
- [ ] Preview/Production domain 등록
- [ ] KakaoTalk 공유 실제 기기 테스트
- [ ] 1200x630 OG 이미지 제작
- [ ] `og:image` absolute production URL 적용
- [ ] `og:url` final domain 적용
- [ ] 카카오톡 링크 미리보기 확인
- [ ] 문자/기타 SNS 공유 확인
- [ ] 필요 시 TMAP deep link 추가

## P9 — Backup / 운영 안정성

- [ ] RSVP 전체 CSV backup
- [ ] Guestbook CSV backup
- [ ] D1 Time Travel 복구 절차 실제 테스트
- [ ] Preview/Production 데이터 완전 분리 확인
- [ ] destructive action confirmation
- [ ] 관리자 모바일 QA
- [ ] 결혼식 직전 최종 RSVP/식사 인원 export
- [ ] 결혼식 이후 RSVP 개인정보 보존/삭제 일정 결정

## P10 — Production Release

- [ ] Preview에서 blocker 0건
- [ ] 실제 사진/연락처/계좌 최종 확인
- [ ] D1 Production binding
- [ ] R2 Production binding
- [ ] Turnstile Production key
- [ ] Cloudflare Access Production policy
- [ ] Kakao Production domain
- [ ] custom domain 연결
- [ ] `noindex` 유지/해제 최종 결정
- [ ] PR 최종 review
- [ ] `main` merge
- [ ] Production build 성공
- [ ] 최종 Android/iOS/Kakao 인앱 검증

---

# 배포 이후 우선 개발 순서

```text
Preview 배포
   ↓
실제 모바일 UI/반응형 수정
   ↓
D1 연결 + RSVP/Guestbook 실데이터 검증
   ↓
Turnstile
   ↓
Admin RSVP/Guestbook 관리
   ↓
Cloudflare Access
   ↓
Admin Settings/Audit
   ↓
R2 Media 관리
   ↓
실제 사진/전화번호/계좌/BGM
   ↓
Kakao Share / OG
   ↓
Backup / Security / 실기기 QA
   ↓
main merge + Production
```

이 순서는 특별한 blocker가 없는 한 이후 개발의 기준 순서로 사용한다.

---

# 현재 외부 정보/설정이 필요한 항목

아래 항목은 코드만으로 최종 완료할 수 없다.

1. 실제 웨딩 사진
2. 신랑/신부 및 필요 시 혼주 전화번호
3. 계좌 정보
4. BGM 파일 및 공개 사용 권리
5. Cloudflare 계정에서 D1/R2/Pages/Access 설정
6. Turnstile Site Key / Secret Key
7. Kakao Developers JavaScript Key 및 최종 production domain
8. 최종 custom domain

---

# 현재 결론

**코드 기능 추가는 여기서 일시적으로 멈추고 Cloudflare Preview 배포를 먼저 수행한다.**

Preview 환경에서 실제 모바일 화면, route, HTTPS browser API, Pages Functions 동작을 확인한 뒤 위 P0 → P10 backlog 순서로 수정·완성한다.
