# Wedding Day EVENT — 구현 상태

최종 업데이트: 2026-09-09

> **상태: CLOSED / HOLD**
>
> Halloween Wedding EVENT 방향은 2026-09-09 기준 보류한다. 구현된 프론트/서버/D1/R2 연동 코드는 삭제하지 않고 유지하지만, 현재 공개 청첩장 UI에서는 EVENT 진입점과 full-screen EVENT 화면을 노출하지 않는다. 향후 이벤트 콘셉트를 다시 확정할 때 재개한다.

기준 계획: `docs/WEDDING_DAY_EVENT_PLAN.md`

## 보류 시점 기준 구현 범위

아래는 재개 시 참고하기 위한 구현 이력이다. 현재 공개 범위에는 포함하지 않는다.

### 완료

- [x] `Asia/Seoul` 기준 BEFORE / WEDDING_DAY / AFTER 날짜 판정
- [x] 2026-10-31 12:00 도달 시 `WE'RE GETTING MARRIED` 자동 전환
- [x] 예식일 전에는 잠긴 상태인 마지막 Pumpkin EVENT 진입점
- [x] 결혼식 당일에만 EVENT 입장 활성화
- [x] Admin 브라우저 한정 EVENT Preview 권한
- [x] EVENT full-screen Portal 분리로 기본 청첩장 레이아웃 영향 차단
- [x] 닉네임/이름 + 신랑측/신부측 필수 선택
- [x] 닉네임/side/진행도 브라우저 localStorage 저장
- [x] 최초 입장 시 자동으로 열리는 Wedding Event Passport
- [x] 상단 `PASS n/4` 재진입 버튼 및 완료 진행률
- [x] Passport 항목 선택 시 해당 EVENT 콘텐츠로 이동
- [x] 무제한 CHEER 카운터 및 D1 집계/batch 처리
- [x] 5 / 10 / 31 / 100회 Cheer Combo milestone
- [x] Secret Message / Secret Photo 해금 구조
- [x] Halloween Scratch Card Canvas 인터랙션
- [x] 일정 비율 이상 긁으면 자동 reveal + 접근성용 즉시 열기 fallback
- [x] 닉네임/side seed 기반 Wedding Fortune 덕담 카드
- [x] Halloween Photo Pass 사진 선택/미리보기/위치/확대 조정
- [x] 1080×1920 Instagram Story용 Canvas 합성 및 로컬 다운로드
- [x] Photo Pass 원본 사진 서버 업로드 없음
- [x] 입장 순서 기반 `1st GUEST`, `2nd GUEST` 등 Photo Pass 표시
- [x] Rolling Paper touch Canvas / D1 stroke JSON 저장
- [x] Rolling Paper polling + 수동 swipe + 자동 슬라이드
- [x] Admin Rolling Paper hide/show/delete 운영 기능
- [x] EVENT body scroll lock / Escape 닫기 / focus trap / 닫은 뒤 원래 포커스 복귀
- [x] `prefers-reduced-motion` 비필수 애니메이션 축소
- [x] 320px대 좁은 화면, 짧은 landscape, safe-area 대응 보강
- [x] localStorage 사용 불가 시에도 메모리 상태로 기능 지속

## 현재 배포 정책

- [x] 공개 청첩장에서 EVENT 진입점 비노출
- [x] EVENT full-screen UI 비노출
- [x] 구현 코드/API/D1 schema는 삭제하지 않고 보존
- [x] 기존 기본 청첩장 기능에는 영향 없음
- [ ] 새 EVENT 콘셉트 확정 후 재개 여부 결정

## 재개 전 확인 항목

- Halloween 콘셉트를 유지할지, 일반 Wedding Day 참여형 이벤트로 재디자인할지 결정
- EVENT 진입 방식과 비주얼 톤 재검토
- Secret Photo / Scratch / Fortune / Photo Pass 중 실제 사용할 기능 재선정
- 실제 단말 QA와 당일 운영 정책 재수립
