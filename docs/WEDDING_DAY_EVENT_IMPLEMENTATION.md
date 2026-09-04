# Wedding Day EVENT — 구현 상태

최종 업데이트: 2026-09-04

기준 계획: `docs/WEDDING_DAY_EVENT_PLAN.md`

## 이번 구현 범위

외부 API 발급, 별도 서비스 가입, D1 migration 또는 R2 신규 콘텐츠 없이 브라우저 코드만으로 완결 가능한 기능을 우선 구현했다.

### 완료

- [x] `Asia/Seoul` 기준 BEFORE / WEDDING_DAY / AFTER 날짜 판정
- [x] 2026-10-31 12:00 도달 시 `WE'RE GETTING MARRIED` 자동 전환
- [x] 예식일 전에는 잠긴 상태인 마지막 Pumpkin EVENT 진입점
- [x] 결혼식 당일에만 EVENT 입장 활성화
- [x] localhost에서만 사용할 수 있는 `?eventPreview=1` 사전 QA 모드
- [x] EVENT full-screen Portal 분리로 기본 청첩장 레이아웃 영향 차단
- [x] 닉네임/이름 + 신랑측/신부측 필수 선택
- [x] 닉네임/side/진행도 브라우저 localStorage 저장
- [x] 최초 입장 시 자동으로 열리는 Wedding Event Passport
- [x] 상단 `PASS n/4` 재진입 버튼 및 완료 진행률
- [x] Passport 항목 선택 시 해당 EVENT 콘텐츠로 이동
- [x] 로컬 무제한 CHEER 카운터
- [x] 5 / 10 / 31 / 100회 Cheer Combo milestone
- [x] 5회 CHEER Secret Message 해금
- [x] Halloween Scratch Card Canvas 인터랙션
- [x] 일정 비율 이상 긁으면 자동 reveal + 접근성용 즉시 열기 fallback
- [x] 닉네임/side seed 기반 Wedding Fortune 덕담 카드
- [x] Halloween Photo Pass 사진 선택/미리보기/위치/확대 조정
- [x] 1080×1920 Instagram Story용 Canvas 합성 및 로컬 다운로드
- [x] Photo Pass 원본 사진 서버 업로드 없음
- [x] EVENT body scroll lock / Escape 닫기 / focus trap / 닫은 뒤 원래 포커스 복귀
- [x] `prefers-reduced-motion` 비필수 애니메이션 축소
- [x] 320px대 좁은 화면, 짧은 landscape, safe-area 대응 보강
- [x] localStorage 사용 불가 시에도 메모리 상태로 기능 지속

## 의도적으로 이번 범위에서 제외

아래는 현재 Cloudflare 인프라만 사용하더라도 서버 저장/API 또는 실제 콘텐츠가 추가로 필요하므로 별도 단계에서 구현한다.

- [ ] EVENT 입장 기록 D1 저장
- [ ] 전체 하객 global CHEER 집계
- [ ] session별 CHEER 서버 집계
- [ ] 실시간 낙서 Rolling Paper D1 저장/공유
- [ ] Rolling Paper Admin hide/delete
- [ ] 실제 Secret Photo R2/Admin slot 및 해금 API

## 공개 전 QA 원칙

- Production에서는 2026-10-31 이전 EVENT 입장 우회 URL을 제공하지 않는다.
- 사전 전체 EVENT 확인은 로컬 개발 서버의 `/?eventPreview=1`에서만 허용한다.
- 실제 Secret Photo가 준비되기 전까지는 완결된 Secret Message만 보여주며 개발용 placeholder 문구는 노출하지 않는다.
- 서버형 기능이 붙기 전까지 닉네임, side, cheer, Passport 진행도는 사용자 브라우저 밖으로 전송하지 않는다.
