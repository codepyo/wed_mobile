# Wedding Mobile 개발 일지

최종 업데이트: 2026-09-09

Production: `https://wed-mobile.robin5544.workers.dev`

## 현재 상태

모바일 청첩장의 핵심 서비스와 운영 기반은 대부분 완성되었다.

- Cloudflare Workers Production 자동 배포
- D1 기반 RSVP / 비공개 편지 / Settings / Audit
- Turnstile 보안 검증
- Cloudflare Access 기반 `/admin`, `/api/admin/*` 보호
- 관리자 Dashboard / RSVP / Letters / Content / Settings / Media
- Admin에서 연락처 / 계좌 입력 및 공개 ON-OFF
- R2 기반 Hero / Gallery / OG / BGM 업로드
- private R2 미디어 공개 전달 API
- 실제 사진 가로/세로 비율 자동 보존
- Open Graph / KakaoTalk 공유 기능
- Kakao Map Web SDK 실제 지도 동작 확인
- Wedding Day / Halloween EVENT 기능 코드는 보존하되 **현재 공개 UI에서는 비노출**

현재 우선순위는 **기본 청첩장 콘텐츠 마감 → 실제 사진/BGM 튜닝 → custom domain → 주요 모바일 환경 최종 QA**다.
Halloween EVENT 작업은 별도 결정 전까지 진행하지 않는다.

---

## 2026-09-09 — Halloween Wedding EVENT 보류 / CLOSED

Halloween 콘셉트가 현재 청첩장 전체 방향과 맞지 않는다고 판단하여 EVENT 페이지 작업을 일단 종료 상태로 전환했다.
기존 구현물을 삭제하거나 롤백하지 않고, 필요 시 다른 콘셉트로 다시 활용할 수 있도록 코드와 서버 구조는 그대로 보존한다.

### 공개 상태

- [x] 기본 청첩장에서 Pumpkin / Halloween EVENT 진입 UI 비노출
- [x] full-screen Halloween EVENT 화면 비노출
- [x] 기존 RSVP / Private Letter / Gallery / Location / Contact / Account / Share / BGM에는 영향 없음
- [x] EVENT 프론트 컴포넌트 및 스타일 코드 보존
- [x] EVENT API / D1 schema / CHEER / Rolling Paper / Secret Photo 구조 보존
- [x] Admin용 EVENT 운영 코드도 삭제하지 않고 보존
- [x] 향후 재개 시 feature flag 수준에서 다시 연결할 수 있도록 구성

### 보류된 기능 자산

다음 기능은 구현 자산으로 남기지만 현재 Release Scope에서는 제외한다.

- 닉네임 + 신랑측/신부측 EVENT 입장
- Event Passport
- CHEER / Combo / Secret Photo
- Scratch Card
- Wedding Fortune 덕담 카드
- Rolling Paper Canvas / D1 / 자동·수동 슬라이드
- Photo Pass / 입장 순서 `1st GUEST` 표시
- EVENT Admin 운영 화면

상세 구현 이력은 `docs/WEDDING_DAY_EVENT_IMPLEMENTATION.md`를 참고한다.
새 이벤트 콘셉트를 확정하기 전에는 위 항목의 추가 개발·운영 준비를 진행하지 않는다.

---

## 2026-09-04 — Wedding Day EVENT 구현 이력 (현재 CLOSED)

기본 청첩장과 분리된 참여형 EVENT를 구현했으나, 2026-09-09 결정에 따라 현재 공개 범위에서 제외했다.
기능 구현 자체는 삭제하지 않고 보존한다.

- [x] BEFORE / WEDDING_DAY / AFTER 날짜 판정
- [x] `WE'RE GETTING MARRIED` 예식 시각 전환
- [x] full-screen EVENT 격리
- [x] 닉네임 / 신랑측·신부측 session
- [x] Event Passport
- [x] CHEER / Combo / Secret 해금
- [x] Scratch Card / Wedding Fortune
- [x] Rolling Paper Canvas / D1 / polling / 자동·수동 slider
- [x] Photo Pass 1080×1920 생성
- [x] 실제 EVENT 입장 순번 기반 Guest Pass 표시
- [x] EVENT session / CHEER / Drawing 서버 구조
- [x] Admin 운영 / Rolling Paper moderation
- [x] Secret Photo R2 slot / 보호 API 구조
- [x] 모바일 viewport / safe-area / reduced-motion / focus 접근성 대응
- [x] Admin 브라우저 전용 Preview 구조

상세 문서:

- `docs/WEDDING_DAY_EVENT_PLAN.md` — 과거 계획안
- `docs/WEDDING_DAY_EVENT_IMPLEMENTATION.md` — 보류 시점 구현 상태

---

## 2026-09-03 — 연락처 / 계좌 Admin 관리 + 비공개 편지함

### 연락처 / 계좌

- [x] 코드에 실제 전화번호 / 계좌번호를 하드코딩하지 않는 구조로 전환
- [x] 기존 D1 `site_settings`를 이용한 관리형 저장
- [x] 별도 D1 table migration 없이 첫 Admin 저장 시 자동 upsert
- [x] Admin `Content` 메뉴 추가
- [x] 신랑 / 신부 / 양가 혼주 연락처 입력
- [x] 신랑측 / 신부측 계좌 입력
- [x] 연락처 / 계좌 섹션 각각 공개 ON-OFF
- [x] 빈 연락처 / 빈 계좌는 공개 화면에서 자동 제외
- [x] 공개 OFF 상태에서는 public site-config 응답에 실제 값을 포함하지 않음
- [x] site-config `no-store` 처리로 공개 OFF 전환 시 stale cache 방지
- [x] 공개 화면 전화 / 문자 / 계좌번호 복사 UX 유지
- [x] 연락처 표기 `신랑 홍승표 / 신부 이제희`

### 비공개 편지함

기존 공개형 Guestbook을 승표·제희만 확인하는 비공개 편지 방식으로 변경했다.

- [x] 공개 청첩장에서 다른 하객 메시지 목록 제거
- [x] 기존 공개 Guestbook GET API에서 메시지 내용 반환 중단
- [x] 새 편지는 DB에 `visible=0`으로 저장
- [x] 공개 삭제 비밀번호 입력 제거
- [x] 공개 사용자 삭제 API 종료, 삭제는 Admin 전용
- [x] 제목 `승표·제희에게 전하는 마음`
- [x] `Private Letter` editorial label 적용
- [x] `남겨주신 편지는 공개되지 않고 승표·제희에게만 조용히 전달됩니다.` 안내
- [x] 편지 전송 성공 시 CSS 봉투 접기 + `S·J` seal 애니메이션
- [x] `prefers-reduced-motion`에서는 정적 완료 화면
- [x] 전송 후 `한 통 더 남기기` 재작성 UX
- [x] Admin `Letters`에서 전체 편지 검색 / 확인 / 삭제
- [x] Admin Settings에서 비공개 편지함 전체 사용 / 신규 작성 ON-OFF

---

## 2026-09-03 — 예식장 하객 안내 반영

- [x] Location의 기존 `자가용` 카드에 주차 안내 통합
- [x] 예식 당일 무료 주차 명시
- [x] 별도 주차 쿠폰 / 도장 없이 출차 가능 안내
- [x] 별도 안내 섹션을 추가하지 않아 Location 정보 밀도 유지

---

## 2026-08-30 — 실제 웨딩 사진 대응

- [x] 실제 촬영본 셀렉션 시작
- [x] Hero / Gallery / OG 용도 분리
- [x] R2 업로드 시 width / height metadata 추출
- [x] public media manifest에 width / height 제공
- [x] 모든 Gallery를 강제 4:5 crop하던 동작 제거
- [x] 가로 / 세로 원본 비율을 실제 레이아웃에 반영
- [x] Gallery 10장 이상 editorial layout 대응
- [x] 공유 OG 1200×630 전용 crop 준비

---

## 2026-08-23 ~ 08-30 — 품질 / UX 안정화

- [x] Hero 영문 이름 clipping 수정
- [x] D-day 날짜 계산 오류 수정
- [x] RSVP 불참 시 불필요한 인원 / 식사 입력 제거
- [x] Web Share 미지원 WebView에서 URL 복사 fallback
- [x] Lightbox 모바일 swipe / focus 처리
- [x] keyboard focus-visible 대응
- [x] prefers-reduced-motion 대응
- [x] 강제 Dark Mode 영향을 줄이기 위한 light color scheme 고정
- [x] Kakao Map / Kakao Share / Turnstile transient failure 재시도
- [x] Kakao Map SDK 지연 로딩
- [x] BGM / R2 byte-range 지원
- [x] 방명록 전체 OFF 상태의 API 직접 등록 차단

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
- [x] Gallery `sort_order` 기준 정렬
- [x] active BGM + `music_enabled` 연동

---

## 2026-08-23 — OG / KakaoTalk 공유

- [x] Open Graph title / description / image / url
- [x] Twitter `summary_large_image`
- [x] `/api/og-image` 고정 공유 이미지 endpoint
- [x] active `OG` 우선, 없으면 active `HERO` fallback
- [x] Kakao Share `sendDefault`
- [x] Kakao 오류 시 Web Share / URL 복사 fallback
- [x] Kakao Developers JavaScript Key / SDK domain / 제품 링크 domain 설정
- [x] Cloudflare Build Variable `VITE_KAKAO_JS_KEY` 등록
- [x] 실제 KakaoTalk 공유 카드 노출 확인

---

## 2026-08-23 — Kakao Map

- [x] 장식용 placeholder 제거
- [x] Kakao Map Web SDK 적용
- [x] 라마다프라자수원호텔 실제 좌표 / marker 표시
- [x] 모바일 페이지 스크롤을 위한 지도 drag / wheel zoom 비활성화
- [x] SDK 실패 fallback 유지
- [x] 카카오맵 / 네이버지도 / 주소 복사 유지
- [x] Production 실제 지도 tile / marker 동작 확인

---

## 기반 구축 완료 항목

- [x] GitHub `main` 기반 Cloudflare 자동 build/deploy
- [x] Vite + React + Cloudflare Functions
- [x] Production / Preview D1
- [x] RSVP 저장 / 관리자 검색 / 삭제 / CSV
- [x] 비공개 편지 저장 / 관리자 확인
- [x] Turnstile Siteverify
- [x] Cloudflare Access 관리자 보호
- [x] Admin mutation audit log
- [x] R2 private media
- [x] KakaoTalk 공유
- [x] Kakao Map

---

# 다음 할 일

## 1. 실제 콘텐츠 입력 / 기본 청첩장 마감

- [ ] Admin `Content`에서 신랑 / 신부 / 혼주 전화번호 입력
- [ ] Admin `Content`에서 양가 계좌 입력
- [ ] 확인 후 연락처 / 계좌 공개 ON
- [ ] 선별한 Hero / Gallery / OG 실제 사진 업로드
- [ ] BGM 최종 파일 업로드 및 재생 확인
- [ ] RSVP 최종 마감일 확정

## 2. 사진 최종 디자인 튜닝

- [ ] 실제 Production 기준 Gallery 순서 검수
- [ ] 사진별 focal point / object-position 미세조정
- [ ] Hero 높이 / crop 모바일 확인
- [ ] Kakao OG 카드 실제 이미지 확인
- [ ] 기존 Gallery 이전 버전 정리 기능 필요 여부 판단

## 3. 공개 주소 확정

- [ ] custom domain 선정 및 Cloudflare 연결
- [ ] HTTPS / redirect 확인
- [ ] Kakao JavaScript SDK domain에 custom domain 추가
- [ ] Kakao 제품 링크 Web domain에 custom domain 추가
- [ ] `og:url` / 공유 링크 custom domain 전환

## 4. 최종 모바일 QA

- [ ] Android Chrome / Samsung Internet
- [ ] iPhone Safari
- [ ] KakaoTalk 인앱 브라우저
- [ ] 320~430px 주요 viewport
- [ ] RSVP / Private Letter / Contact / Account / Share / Map / BGM 회귀 테스트
- [ ] 이미지 로딩 / interaction 성능 확인

## 5. 후순위 운영 편의

- [ ] RSVP 수정 / restore / server-side pagination
- [ ] Private Letter CSV export / pagination
- [ ] Media Gallery reorder / focal point editor
- [ ] Media object 삭제 / 버전 관리
- [ ] Preview Worker + Preview D1/R2 완전 분리 검증

## 보류 — Wedding Day / Halloween EVENT

- [ ] **CLOSED / HOLD — 새 콘셉트 결정 전 추가 개발하지 않음**
- 기존 구현 코드 / API / D1 / R2 구조는 보존
- 재개 시 Halloween을 유지할지 일반 Wedding Day 참여형 UI로 바꿀지 먼저 결정

## 권장 진행 순서

`실제 연락처·계좌/사진 입력 → 기본 청첩장 최종 QA → custom domain → 전체 실기기 QA → 후순위 운영 편의`
