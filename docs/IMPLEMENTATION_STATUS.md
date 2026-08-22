# 구현 진행 현황

기준 문서:

- `docs/DEVELOPMENT_PLAN.md`
- `docs/ADMIN_CONSOLE_PLAN.md`

최종 업데이트: 2026-08-22
현재 단계: **Cloudflare Workers 1차 Production 배포 완료 / D1 연결 진행 전**

표기:

- `[x]` 코드 구현 완료 또는 실제 배포 검증 완료
- `[~]` 코드 기반 구현 완료, 실제 데이터/Cloudflare 설정 또는 추가 실기기 검증 필요
- `[ ]` 미구현 / 배포 이후 개발 예정

---

# 0. 배포 체크포인트

`main` 기준 Cloudflare Workers Production 배포 완료.

- Production URL: `https://wed-mobile.robin5544.workers.dev`
- `/` 공개 청첩장 접근 정상
- `/admin` 직접 접근 및 새로고침 라우팅 정상
- 카카오맵 / 네이버지도 외부 링크 정상
- 주소 복사 등 HTTPS browser API 기본 동작 확인
- D1 미연결 상태이므로 Admin Dashboard 데이터 조회 실패 메시지는 현재 정상

현재부터는 Production/Preview 배포 결과를 기준으로 실제 모바일 환경에서 확인하면서 D1 → Admin → Media 순으로 개발한다.

---

# 1. 1차 Production 배포 관찰사항

아래 내용은 첫 실배포 확인 결과이며, 즉시 수정하지 않고 이후 QA/개발 backlog로 유지한다.

## UI / 모바일 색상

- [~] PC에서는 기본 청첩장/관리자 화면이 밝게 표시되지만 일부 모바일에서는 전체 화면이 어둡게 표시되는 현상 확인
- 코드의 의도된 기본 배경은 Warm Ivory / light이며 `Date`, `Location` 등 특정 section만 dark design임
- Admin 역시 코드상 밝은 회색/흰색 UI가 정상 디자인임
- 따라서 모바일 전체 dark 표시는 의도된 반응형 디자인이 아니며, Samsung Internet/Chrome 등의 강제 Dark Mode 또는 브라우저 색상 변환 가능성을 우선 점검
- 이후 `color-scheme`, browser forced dark 대응, 실제 Android/Samsung Internet/Kakao 인앱 브라우저별 비교 필요

## 지도

- [x] 현재 지도 영역의 십자형 target/pin + `RAMADA PLAZA SUWON` 표시는 의도된 placeholder UI
- [x] 카카오맵 / 네이버지도 외부 링크는 실제 위치 링크로 정상 동작 확인
- [ ] 이후 Kakao Map SDK 또는 실제 지도 embed 적용 여부 결정
- 실제 지도 embed 전까지 placeholder가 오동작은 아니지만 사용자에게 지도처럼 오해될 수 있으므로 최종 UX 단계에서 디자인 재검토

## Admin

- [x] `/admin` Dashboard scaffold 접근 정상
- [x] 새로고침 후 SPA route 정상
- [x] D1 미연결 상태에서 `관리자 데이터를 불러오지 못했습니다. Cloudflare D1/Access 연결 전에는 정상적인 상태입니다.` 표시 정상
- [x] `RSVP / Guestbook / Media / Settings / System`은 현재 navigation label만 구현되어 있으며 클릭되지 않는 것이 현재 코드상 정상
- [ ] D1 연결 이후 RSVP/Guestbook부터 실제 route/API/UI 구현
- [ ] Media/Settings/System route 및 화면 구현
- [ ] 모바일 Admin 강제 Dark Mode 현상 별도 QA

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
- [~] 모바일 강제 Dark Mode 대응 검토

## Phase 3 — 기본 완성 기능

- [~] 연락처 UI/전화/문자 기능 완료, 실제 신랑/신부/혼주 번호 입력 필요
- [x] `.ics` 캘린더 일정 추가
- [x] Gallery lightbox
- [x] Gallery 이전/다음/ESC keyboard control
- [~] 지도: placeholder + 외부 카카오맵/네이버지도 완료, 실제 Kakao Map SDK embedding 미구현
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
- [x] Cloudflare Workers GitHub build/deploy 구성
- [x] Cloudflare Production deployment
- [ ] feature branch Preview deployment 실제 검증
- [ ] dependency version pinning
- [ ] `package-lock.json` commit
- [ ] custom domain 연결

---

# 배포 이후 개발 필요사항 — 우선순위 Backlog

## P0 — 배포 직후 UI/브라우저 QA

- [x] `/` 직접 접근 정상
- [x] `/admin` 직접 접근 및 새로고침 라우팅 정상
- [x] 카카오맵/네이버지도 링크 정상
- [x] 주소 복사 정상
- [ ] feature branch Preview build/URL 실제 검증
- [~] 모바일 실제 스크롤/viewport/safe-area 확인 진행 중
- [ ] 모바일 강제 Dark Mode 원인 확인 및 대응 여부 결정
- [ ] Chrome DevTools 320/344/360/375/390/393/412/430px 확인
- [ ] 실제 Android Chrome 확인
- [ ] Samsung Internet Dark Mode ON/OFF 비교
- [ ] 가능하면 iPhone Safari 확인
- [ ] KakaoTalk 인앱 브라우저 확인
- [ ] console error / network 404 확인
- [ ] Lighthouse 또는 동등 수준으로 CLS/LCP/기본 접근성 확인

## P1 — Cloudflare 데이터 기능 연결

- [ ] Preview용 D1 `wedding-db-preview` 생성
- [ ] Production용 D1 `wedding-db-production` 생성
- [ ] `database/schema.sql` 적용
- [ ] Worker `WEDDING_DB` D1 binding
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
- [ ] 최종 Android/iOS/Kakao 인앱 검증

---

# 배포 이후 우선 개발 순서

```text
Workers Production 배포
   ↓
실제 모바일 UI/반응형 관찰 및 backlog 기록
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
```

이 순서는 특별한 blocker가 없는 한 이후 개발의 기준 순서로 사용한다.

---

# 현재 외부 정보/설정이 필요한 항목

1. 실제 웨딩 사진
2. 신랑/신부 및 필요 시 혼주 전화번호
3. 계좌 정보
4. BGM 파일 및 공개 사용 권리
5. Cloudflare 계정에서 D1/R2/Access 설정
6. Turnstile Site Key / Secret Key
7. Kakao Developers JavaScript Key 및 최종 production domain
8. 최종 custom domain

---

# 현재 결론

**Cloudflare Workers 1차 Production 배포는 완료되었다.**

현재 확인된 모바일 강제 Dark Mode 가능성, 지도 placeholder, Admin navigation 미구현 상태는 backlog에 기록했으며 지금은 코드를 수정하지 않는다.

다음 단계는 **D1 데이터베이스 생성 → `WEDDING_DB` binding → `database/schema.sql` 적용 → RSVP/Guestbook 실데이터 검증**이다.
