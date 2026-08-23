# Wedding Mobile 개발 일지

최종 업데이트: 2026-08-23

Production: `https://wed-mobile.robin5544.workers.dev`

## 현재 상태

모바일 청첩장의 핵심 서비스 기반은 대부분 완성되었다.

- Cloudflare Workers Production 배포
- D1 기반 RSVP / Guestbook / Settings / Audit
- Turnstile 보안 검증
- Cloudflare Access 기반 `/admin`, `/api/admin/*` 보호
- 관리자 Dashboard / RSVP / Guestbook / Settings / Media
- R2 기반 Hero / Gallery / OG / BGM 업로드
- private R2 미디어 공개 전달 API
- Hero / Gallery / BGM 공개 화면 연결
- Open Graph / KakaoTalk 공유 기능
- Kakao Map Web SDK 지도 구현 및 Production 배포

현재는 신규 기반 기능 개발보다 **실제 콘텐츠 입력, 지도 실화면 확인, custom domain, 모바일 최종 QA** 단계에 가깝다.

---

## 2026-08-22 — Production / 데이터 / 관리자 기반

### Cloudflare Workers

- [x] GitHub `main` 기반 자동 build/deploy
- [x] Vite 정적 자산 + Functions Worker bundle 통합
- [x] `/api/*` worker-first 라우팅
- [x] SPA fallback 및 `/admin` 직접 접근/새로고침

### D1

- [x] Production DB `wedding-db-production`
- [x] Preview DB `wedding-db-preview`
- [x] `site_settings`, `rsvp`, `guestbook`, `media_assets`, `admin_audit_log`
- [x] Production binding `WEDDING_DB`
- [x] RSVP / Guestbook 실제 저장 검증
- [x] 한글 UTF-8 저장 검증

### Turnstile

- [x] Production widget 및 runtime secret 연결
- [x] RSVP / Guestbook Siteverify 검증
- [x] token 만료/오류 처리
- [x] 실제 브라우저 보안 확인 완료

### Cloudflare Access / Admin

- [x] `/admin*` 보호
- [x] `/api/admin/*` 보호
- [x] Dashboard KPI / audit
- [x] RSVP 검색 / 삭제 / CSV
- [x] Guestbook 검색 / hide-show / 삭제
- [x] Settings: RSVP / Guestbook / BGM ON-OFF
- [x] Admin mutation audit log

---

## 2026-08-23 — 관리자 모바일 안정화

- [x] RSVP / Guestbook 진입 시 전체 페이지 가로 overflow 수정
- [x] table wrapper 내부 스크롤로 격리
- [x] 모바일 Admin navigation 높이 안정화
- [x] 긴 목록의 페이지 전체 세로 확장 완화
- [~] 장기 개선: RSVP / Guestbook server-side pagination
- [ ] 최종 QA에서 320~430px 주요 viewport 재확인

---

## 2026-08-23 — R2 Media

### 저장 / 업로드

- [x] Production R2 `wedding-media-production`
- [x] Preview R2 `wedding-media-preview`
- [x] Worker binding `WEDDING_MEDIA`
- [x] Admin Media 메뉴
- [x] Hero / Gallery / OG / BGM 업로드
- [x] MIME / 파일 크기 validation
- [x] R2 업로드 후 D1 실패 시 rollback
- [x] Media audit log
- [x] 실제 이미지 업로드 동작 확인

### 공개 전달

- [x] R2 bucket private 유지
- [x] `/api/media` active asset manifest
- [x] `/api/media/:id` R2 streaming
- [x] UUID asset 장기 cache
- [x] active Hero 공개 화면 자동 반영
- [x] Gallery 업로드 시 공개 Gallery 자동 포함
- [x] Gallery `sort_order` 기준 정렬
- [x] active BGM + `music_enabled` 연동

### 실제 사진 확정 후 후순위

- [ ] Gallery 최종 전체 레이아웃
- [ ] Gallery reorder UI
- [ ] 사진 focal point / object-position 편집 UI
- [ ] Hero / Gallery crop 세부 튜닝
- [ ] Media object 비활성 / 삭제 / 버전 관리
- [ ] width / height metadata 자동 추출

---

## 2026-08-23 — OG / KakaoTalk 공유

### 구현 및 설정

- [x] Open Graph title / description / image / url
- [x] Twitter `summary_large_image`
- [x] `/api/og-image` 고정 공유 이미지 endpoint
- [x] active `OG` 우선, 없으면 active `HERO` fallback
- [x] Kakao Share `sendDefault`
- [x] Kakao 공유 링크를 청첩장 root URL로 정규화
- [x] Kakao 오류 시 Web Share / URL 복사 fallback
- [x] Kakao Developers 앱 / JavaScript Key 생성
- [x] JavaScript SDK Production domain 등록
- [x] 제품 링크 Web domain 등록
- [x] Cloudflare Build Variable `VITE_KAKAO_JS_KEY` 등록
- [x] 새 Production build로 JavaScript Key 반영
- [x] 실제 KakaoTalk 공유 카드 노출 확인
- [x] OG 미등록 상태에서 Hero 사진 fallback 확인

### 선택적 마무리

- [ ] Admin Media에 공유 전용 `OG` 이미지 업로드
- [ ] custom domain 적용 후 `og:url`, Kakao domain 설정 변경

공유 기능 자체는 현재 실사용 가능한 상태다.

---

## 2026-08-23 — Kakao Map

### 구현

- [x] 기존 장식용 map placeholder 제거
- [x] Kakao Map Web SDK 컴포넌트 구현
- [x] 기존 `VITE_KAKAO_JS_KEY` 재사용
- [x] 라마다프라자수원호텔 좌표 중심 설정
- [x] 호텔 marker 표시
- [x] 모바일 스크롤 방해 방지를 위해 지도 drag / wheel zoom 비활성화
- [x] Kakao SDK 실패 시 fallback UI 유지
- [x] 카카오맵 / 네이버지도 / 주소 복사 외부 동작 유지
- [x] CI 통과 및 Production 배포

### 남은 확인

- [ ] Kakao Developers의 Kakao Map 이용 설정 ON 확인
- [ ] Production에서 실제 지도 tile / marker 표시 확인
- [ ] 모바일에서 지도 구간 스크롤 UX 확인
- [ ] 카카오맵 / 네이버지도 / TMAP 링크 최종 검수

---

# 다음 할 일

## 1. 바로 확인할 것

- [ ] Production 오시는 길에서 실제 Kakao Map 표시 확인
- [ ] 지도 marker 위치 확인
- [ ] 모바일 스크롤 시 지도 영역이 화면 이동을 방해하지 않는지 확인

## 2. 실제 청첩장 콘텐츠 입력

- [ ] 실제 Gallery 웨딩 사진 업로드
- [ ] 신랑 / 신부 / 혼주 연락처 입력 및 Contact 활성화
- [ ] 신랑측 / 신부측 계좌 정보 입력 및 Account 활성화
- [ ] 최종 BGM 업로드 및 재생 검증
- [ ] 문구 / 교통 / 주차 안내 최종 검수
- [ ] 필요 시 공유 전용 OG 이미지 업로드

## 3. 공개 주소 확정

- [ ] custom domain 선정 및 Cloudflare 연결
- [ ] custom domain HTTPS / redirect 확인
- [ ] Kakao JavaScript SDK domain에 custom domain 추가
- [ ] Kakao 제품 링크 Web domain에 custom domain 추가
- [ ] `og:url` 및 공유 링크를 custom domain 기준으로 변경

## 4. 최종 모바일 QA

- [ ] Android Chrome
- [ ] iPhone Safari
- [ ] KakaoTalk 인앱 브라우저
- [ ] 강제 Dark Mode 대응
- [ ] Hero / Gallery 이미지 용량 및 로딩 성능
- [ ] RSVP / Guestbook / 공유 / 지도 / BGM 전체 회귀 테스트

## 5. 운영 편의 기능 — 필요할 때

- [ ] RSVP 상세 필터 / 수정 / restore
- [ ] RSVP server-side pagination
- [ ] Guestbook restore / CSV export
- [ ] Guestbook server-side pagination
- [ ] Media Gallery reorder / focal point editor
- [ ] Media object 삭제 / 버전 관리
- [ ] Preview Worker + Preview D1/R2 완전 분리 검증

## 권장 진행 순서

`Kakao Map Production 확인 → 실제 연락처/계좌/BGM/사진 입력 → custom domain → Android/iPhone/Kakao 인앱 최종 QA → Gallery/관리자 세부 편의 기능`
