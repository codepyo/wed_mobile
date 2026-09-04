# 승표 & 제희 Wedding Day Event 확장 계획

최종 수정: 2026-09-04
예식일: 2026-10-31 12:00

## 1. 방향

기본 모바일 청첩장은 현재의 Wedding Editorial / Quiet Luxury 톤을 유지한다.
할로윈 및 참여형 기능은 기본 화면에 과하게 섞지 않고, 페이지 가장 마지막의 별도 `EVENT` 진입점 안으로 격리한다.

원칙:

- 일반 하객은 기존 청첩장만 이용해도 모든 필수 정보를 얻을 수 있다.
- 참여를 원하는 하객만 Wedding Day Event로 진입한다.
- EVENT는 결혼식 당일에만 활성화하는 것을 기본으로 한다.
- EVENT 내부는 본문과 달리 Halloween Wedding 테마를 적극적으로 사용한다.
- 사진/낙서/반응 기능은 모바일 터치 우선으로 설계한다.
- EVENT 첫 진입 직후 `Event Passport`를 열어 무엇을 할 수 있는지 먼저 안내한다.
- 개인정보 및 참여 기록은 최소 수집한다.
- 이벤트 참여 기록이 저장되는 경우 입장 화면에 짧은 안내를 제공한다.
- 불필요한 원본 사진 서버 저장은 피하고, 가능하면 브라우저 로컬 처리 또는 D1 경량 데이터로 해결한다.
- 날씨 기능과 Cheer 랭킹은 현재 EVENT 개발 범위에서 제외한다.

---

## 2. 날짜 상태

### BEFORE

- 기본 청첩장 정상 제공
- EVENT 마지막 섹션의 호박 버튼은 잠금 상태
- 문구 예: `10.31 · WEDDING DAY ONLY`
- 보조 문구 예: `결혼식 당일에 열리는 작은 이벤트예요.`

### WEDDING DAY

- EVENT 호박 버튼 활성화
- 예식 시각 전에는 기존 D-Day/시간 정보를 유지
- 2026-10-31 12:00 도달 시 주요 순간 문구를 `WE'RE GETTING MARRIED`로 전환
- EVENT 진입 시 Halloween Wedding 전용 테마 활성화

### AFTER

- 기본 청첩장은 유지
- RSVP 등 시한성 기능은 운영 설정에 따라 종료
- EVENT는 추후 `THANK YOU / MEMORIES` 모드로 전환 가능하도록 확장 지점만 마련
- 자동 전환의 구체적인 공개 기간은 실제 운영 전에 확정

---

## 3. Wedding Day EVENT 진입점

페이지 마지막 Closing 아래에 별도 이벤트 섹션을 둔다.

### UI

- 반응형 호박(Pumpkin) 형태의 버튼
- CSS/SVG 기반으로 구현하여 별도 이미지 의존 최소화
- 작은 화면에서는 카드 폭에 맞춰 자동 축소
- hover보다 touch/press 피드백 우선
- 당일 전: 잠금 상태
- 당일: 은은하게 빛나거나 호흡하는 정도의 모션
- `prefers-reduced-motion`에서는 정적 버튼

예시:

```text
HALLOWEEN WEDDING EVENT

        🎃
   ENTER THE PARTY

10.31 당일에만 입장할 수 있어요.
```

### 진입 방식

1차 권장안은 별도 새 창보다 현재 SPA 내 full-screen Event View 또는 `/event` route를 사용한다.
기본 청첩장과 테마/상태를 분리하기 쉽고 다시 돌아오기도 편하다.

---

## 4. EVENT 입장 — 닉네임 + 신랑측/신부측

당일 호박 버튼 클릭 후 간단한 입장 화면을 표시한다.

```text
TRICK OR WEDDING?
오늘 어떤 이름으로 놀러오셨나요?

[ 닉네임 또는 이름 ]

어느 쪽 하객이신가요?
[ 신랑측 ] [ 신부측 ]

[ 입장하기 ]
```

### 입력 규칙

- 닉네임 또는 이름 필수
- `신랑측 / 신부측` 중 하나 필수 선택
- 닉네임은 EVENT 안에서만 표시하며 공개 청첩장에는 영향을 주지 않음
- 선택한 side는 개인화 문구, 참여 기록, 향후 기능 분기에 사용할 수 있음

입장 후에는 닉네임을 EVENT 화면 곳곳에 사용한다.

예:

- `민수님, 승표·제희의 Halloween Wedding에 오신 걸 환영해요.`
- `민수님이 보낸 축하 37회`
- `민수님의 낙서가 롤링페이퍼에 도착했어요.`

필요하면 side에 따라 작은 보조 문구를 다르게 할 수 있다.

```text
신랑측 → 승표의 사람, 오늘도 크게 축하해주세요.
신부측 → 제희의 사람, 오늘의 순간을 함께 즐겨주세요.
```

### 서버 세션 / 참여 기록

- 랜덤 event session id 발급
- nickname
- side: `GROOM | BRIDE`
- entered_at
- 마지막 활동 시각
- 축하 버튼 누적 횟수
- Passport 진행 상태에 필요한 최소 활동 정보

닉네임을 이용한 참여 로그 저장은 숨겨서 수집하지 않는다.
입장 화면에 이벤트 운영을 위한 최소 기록 저장 안내를 짧게 표시한다.
IP 주소나 불필요한 브라우저 fingerprint는 별도 저장하지 않는다.

---

## 5. Event Passport — 최초 안내 + 열고 닫는 오버레이

EVENT 안에서 하객이 무엇을 하면 되는지 처음부터 알 수 있도록 `Wedding Event Passport`를 핵심 내비게이션으로 사용한다.

### 첫 진입

입장 성공 직후 Passport 오버레이를 자동으로 한 번 연다.

```text
HALLOWEEN WEDDING PASS
민수님의 오늘 할 일

□ 축하 5번 보내기
□ 비밀 사진 열기
□ Scratch Card 긁기
□ 오늘의 축복 받기
□ 롤링페이퍼에 낙서 남기기
□ Halloween Photo Pass 만들기

[ EVENT 시작하기 ]
```

### 상시 접근

오버레이를 닫은 뒤에는 화면 상단 또는 우측 상단에 작은 반응형 Passport 버튼을 고정한다.

```text
PASS 2 / 6
```

- 탭하면 Passport 오버레이 다시 열림
- 스크롤을 방해하지 않는 크기
- safe-area 대응
- 완료 항목은 즉시 체크
- 각 항목을 누르면 해당 EVENT 섹션으로 이동
- 최초 자동 오픈 여부와 단순 진행 상태는 localStorage에 저장 가능
- 서버에는 필요한 기능 이벤트만 저장하고 Passport UI 자체 때문에 추가 write를 남발하지 않음

### 목적

이벤트 기능이 여러 개 생겨도 사용자가 `뭘 해야 하는지 모르겠다`는 상태가 되지 않도록 하는 온보딩이자 메뉴 역할을 한다.

---

## 6. 무제한 축하 버튼 + 실시간 카운터

EVENT 안에 반복해서 누를 수 있는 `CHEER` 버튼을 둔다.

```text
TAP TO CELEBRATE

        ♥
     12,482

민수님 37 CHEERS
```

### 동작

- 하객은 제한 없이 연속 탭 가능
- 화면에서는 즉시 숫자/particle 반응
- 네트워크 요청은 탭마다 보내지 않고 300~700ms 단위로 batch flush
- global total과 event session별 횟수를 D1에 누적
- `visibilitychange / pagehide` 때 남은 횟수 flush
- 공개 랭킹은 만들지 않는다.

### 서버 기록

- global cheer total
- session_id
- nickname
- side
- session별 누적 cheer count

개인별 횟수는 서버에서 운영 확인 가능하지만 경쟁형 랭킹 UI로 노출하지 않는다.

---

## 7. Cheer Combo 효과

연속 탭에 작은 milestone 연출을 추가한다.

권장 초기 milestone:

- 5회: Secret Photo 해금
- 10회: `10 CHEER COMBO` + 작은 별/하트 particle
- 31회: `31 OCT COMBO` + 박쥐/호박 실루엣 효과
- 100회: `100 CHEERS` + 가장 큰 축하 animation

원칙:

- 기본 카운터 입력감은 즉시 유지
- milestone 효과는 0.5~1.5초 내 짧게 종료
- Android 등 지원 환경에서 매우 짧은 vibration을 선택적으로 사용할 수 있음
- `prefers-reduced-motion`에서는 particle/transform을 최소화하고 텍스트 배지만 표시
- Combo는 경쟁 요소가 아니라 개인 Easter Egg 성격으로 사용

---

## 8. 5회 축하 Secret Photo Unlock

축하 버튼을 5회 누르면 작은 Easter Egg를 해금한다.

```text
5 CHEERS!
A SECRET JUST OPENED 🎃

[ 비밀 사진 보기 ]
```

### 미디어 구조

- 기존 R2 Media에 `EVENT_SECRET` 또는 `SECRET_GALLERY` slot 추가
- Admin에서 숨겨진 사진을 별도 업로드/관리
- 기본 public media manifest에는 포함하지 않음
- EVENT session의 cheer count가 5 이상일 때 전용 API로 manifest 제공

초기에는 1장을 기준으로 하고, 필요하면 31/100회 milestone의 다른 메시지나 미디어로 확장할 수 있다.

---

## 9. Halloween Scratch Card

모바일 터치로 직접 긁어 내용을 발견하는 가벼운 참여 기능.

### UX

```text
SCRATCH TO REVEAL
오늘의 비밀 카드

████████████████
손가락으로 긁어보세요.
```

- Canvas overlay를 손가락으로 문질러 지우는 방식
- 일정 비율 이상 긁으면 자동으로 전체 reveal
- 안쪽 콘텐츠는 비밀 사진, 둘의 짧은 TMI, 축하 문구 중 하나
- 서버 저장이 필요하지 않은 콘텐츠를 우선 사용
- Passport에서 완료 상태 표시

1차는 매번 같은 카드여도 충분하고, 이후 여러 카드 중 session seed로 하나를 고르는 방식으로 확장 가능하다.

---

## 10. 오늘의 Wedding Fortune — 운세보다 덕담

점술 느낌보다 `오늘 결혼식에 와준 하객에게 건네는 작은 축복/덕담 카드`로 디자인한다.

```text
TODAY'S WEDDING FORTUNE

민수님의 오늘의 축복

좋은 사람들의 웃음이
오늘의 행운으로 오래 남을 거예요.

LUCKY MOMENT
함께 찍은 한 장의 사진
```

### 생성 방식

- 닉네임 + side + event session의 안정적인 seed를 사용
- 미리 준비한 고급스러운 덕담 문구 세트에서 조합
- 같은 세션에서는 새로고침해도 같은 결과 유지
- 외부 AI/API 호출 없음
- 서버 저장 없어도 구현 가능

문구 방향:

- 건강 / 사랑 / 우정 / 새로운 시작 / 좋은 인연 / 웃음 / 추억
- 지나친 사주·점술 표현 제외
- 결혼식 참석자에게 따뜻한 덕담을 한 장 건네는 느낌
- 신랑측/신부측 여부에 따라 일부 문구를 자연스럽게 다르게 할 수 있음

Passport 완료 항목으로 사용한다.

---

## 11. 실시간 낙서 롤링페이퍼

하객이 손가락으로 간단한 그림이나 메시지를 그려 올리는 참여형 기능.

### UX

- `DRAW SOMETHING FOR US`
- 터치 Canvas
- 펜 굵기 2~3단계
- Halloween Wedding 팔레트 4~5색 이내
- Undo / Clear
- 짧은 한 줄 caption 선택
- `롤링페이퍼에 붙이기` 버튼

### 저장 방식

이미지 PNG를 매번 R2에 저장하는 방식보다 `stroke JSON`을 D1에 저장한다.

```json
{
  "strokes": [
    {"color":"#171717","width":4,"points":[[12,20],[14,22],[18,26]]}
  ]
}
```

장점:

- 한 낙서당 수 KB~수십 KB 수준
- R2 용량을 거의 사용하지 않음
- Canvas에서 그대로 재생 가능
- 색상/배경 테마 변경 가능
- Admin hide/delete 가능

### 실시간 표시

EVENT 화면 일부에 `LIVE ROLLING PAPER` 영역을 만든다.

- 최근 낙서 카드들을 가로 slider / marquee 형태로 순환
- 5~10초 polling으로 새 항목 확인
- WebSocket/Durable Object까지는 1차에 도입하지 않음
- 새 낙서가 들어오면 부드럽게 추가
- Admin에서 부적절한 항목 숨김 가능
- nickname과 side는 카드의 작은 서명/배지로 선택적으로 표시 가능

난이도: 중간 이하. 현재 D1 + Worker 구조로 충분히 구현 가능.

---

## 12. Halloween Instagram 인증 프레임

하객 사진을 서버에 저장하지 않고 브라우저에서만 처리하는 기능.

### UX

단순 파일 업로드 버튼처럼 보이지 않도록 `사진을 넣는 프레임/슬롯` 자체가 인터랙션이 되게 한다.

```text
HALLOWEEN PHOTO PASS

┌────────────────────┐
│                    │
│   DROP YOUR PHOTO  │
│      IN HERE       │
│                    │
└────────────────────┘

사진을 넣으면 승표·제희의
Halloween Wedding Frame으로 만들어드려요.
```

- 박스를 탭하면 사진 선택
- drag & drop 가능한 환경에서는 drop 지원
- 모바일에서는 카메라/앨범 선택
- 선택한 사진을 즉시 프레임 안에 미리보기
- 확대/이동 정도의 간단한 crop 조정
- Canvas 합성
- Instagram Story용 1080×1920 우선
- 필요하면 1080×1350 feed 버전도 제공
- 결과 파일만 로컬 다운로드

### 개인정보 / 용량

- 사진 원본 서버 업로드 없음
- R2 저장 0
- 브라우저 메모리 안에서만 Canvas 합성
- 다운로드 후 객체 URL 정리

난이도: 중간. 비용 대비 효과가 높아 우선순위 높음.

---

## 13. Private Letter 전송 애니메이션

비공개 편지 전송 성공 시 CSS 봉투 애니메이션을 제공한다.

흐름:

1. 편지 전송 성공
2. 편지가 봉투 안으로 들어감
3. 봉투 flap이 닫힘
4. `S · J` seal 표시
5. `승표·제희에게 전달되었습니다.`

- 이미지 없이 CSS로 구현
- 1~2초 내 짧게 종료
- reduced-motion 사용자는 애니메이션 없이 완료 상태 바로 표시

현재 구현 완료.

---

## 14. Countdown 순간 문구

예식 시작 시각 기준으로 카운트다운의 상태를 바꾼다.

- BEFORE: 현재 D-Day / 필요 시 HH:MM countdown
- 2026-10-31 12:00 도달: `WE'RE GETTING MARRIED`
- 이후 문구는 실제 디자인 단계에서 `JUST MARRIED` 또는 감사 문구로 확장 여부 결정

새로고침 없이 화면을 열어둔 상태에서도 시각 도달 시 문구가 전환되도록 timer를 둔다.

---

## 15. 구현 우선순위

### Phase A — 짧은 개선

- [x] Private Letter CSS 봉투 애니메이션
- [ ] Countdown `WE'RE GETTING MARRIED`

### Phase B — EVENT shell / onboarding

- [ ] 페이지 마지막 Pumpkin Event entrance
- [ ] BEFORE / WEDDING DAY / AFTER phase helper
- [ ] 당일 입장 gate
- [ ] nickname + 신랑측/신부측 event session
- [ ] Halloween Event theme shell
- [ ] 최초 자동 오픈 Event Passport
- [ ] 상단/고정형 Passport reopen button
- [ ] Passport 완료 상태 / 섹션 이동

### Phase C — 축하 / Easter Egg

- [ ] 무제한 Cheer button
- [ ] global count
- [ ] session별 cheer count
- [ ] Cheer Combo 5 / 10 / 31 / 100 milestone
- [ ] 5 cheers Secret Photo unlock
- [ ] Admin EVENT_SECRET media 관리

### Phase D — 가벼운 참여 콘텐츠

- [ ] Halloween Scratch Card
- [ ] Wedding Fortune / 덕담 카드
- [ ] Passport 진행 연동

### Phase E — 창작형 기능

- [ ] Canvas 낙서 롤링페이퍼
- [ ] D1 stroke JSON 저장
- [ ] Live Rolling Paper slider
- [ ] Admin 낙서 hide/delete
- [ ] Halloween Instagram Photo Frame
- [ ] local-only Canvas 합성 / 다운로드

### Phase F — 예식 후

- [ ] RSVP 자동 비중 축소/종료 검토
- [ ] EVENT Thank-you / Memories 모드
- [ ] 참여 데이터 보존 기간 및 cleanup 정책 확정

---

## 16. 비용 / 저장 전략

### R2

- 하객 원본 사진 업로드 기능은 현재 계획에서 제외
- Instagram 인증 프레임은 local-only라 R2 0 bytes
- 낙서는 stroke JSON으로 D1 저장
- R2는 기존 웨딩 미디어와 Secret Photo 정도만 추가

### D1

주요 추가 데이터는 텍스트/숫자/짧은 JSON 위주다.

- event session
- nickname
- side
- entered_at / activity timestamp
- cheer count
- rolling-paper stroke JSON
- moderation status

Scratch Card, Wedding Fortune, Passport UI 진행 상태 대부분은 브라우저에서 처리할 수 있어 불필요한 DB write를 만들지 않는다.
웨딩 규모에서는 저장량 부담이 매우 낮을 것으로 예상한다.

---

## 17. 디자인 원칙

Halloween이라고 해서 기본 청첩장을 주황/보라 테마로 바꾸지 않는다.

EVENT 내부에서만 다음 요소를 허용한다.

- pumpkin orange
- ink black
- warm ivory
- muted dark green 정도의 보조색
- 작은 ghost / bat / star / pumpkin silhouette
- film grain / paper texture
- CSS glow

피해야 할 것:

- 과도한 공포 이미지
- 큰 emoji 남발
- 네온 게임 UI
- 공개 랭킹처럼 경쟁을 과하게 유도하는 요소
- 기본 청첩장까지 Halloween 테마로 오염시키는 것
- 자동 재생 효과음

목표는 `Halloween Party`보다 `Halloween Wedding Editorial`에 가깝게 잡는다.
