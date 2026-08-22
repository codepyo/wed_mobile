# 승표 & 제희 모바일 청첩장 — 전체 개발 계획

> 이 문서는 `codepyo/wed_mobile`의 최종 개발 방향을 정의하는 기준 문서(Single Source of Truth)다.
> 이후 디자인/기능/반응형/배포 수정은 특별한 이유가 없는 한 이 문서를 기준으로 진행한다.
>
> 작성 기준: 2026-08-22
> 예식일: 2026-10-31 토요일 낮 12시
> 장소: 라마다프라자수원호텔 3층

---

## 1. 프로젝트 목표

모바일에서 링크 하나로 전달할 수 있는 **트렌디하고 고급스러운 웨딩 에디토리얼 스타일의 모바일 청첩장**을 제작한다.

핵심 방향은 다음과 같다.

- 웨딩 사진이 주인공이고 UI는 사진을 방해하지 않는다.
- 사진이 흑백 또는 블랙/오렌지 계열이어도 UI 자체에 오렌지를 반복 사용하지 않는다.
- UI는 오프화이트, 잉크 블랙, 차콜, 웜 그레이를 중심으로 절제한다.
- 전형적인 템플릿형 모바일 청첩장보다 웨딩 매거진/룩북 같은 인상을 준다.
- 감성적인 화면과 실제 사용 편의성(지도, 계좌 복사, 참석 여부, 공유)을 동시에 확보한다.
- iPhone/Android/카카오톡 인앱 브라우저 등 실제 전달 환경을 우선한다.
- 사진, 문구, 연락처, 계좌, 예식 정보는 코드와 분리하여 나중에 쉽게 교체한다.
- GitHub push → Cloudflare Pages 자동 배포를 최종 운영 방식으로 한다.

---

## 2. 확정된 실제 콘텐츠

### 2.1 신랑 · 신부

- 신랑: 승표
- 신랑 영문: SEUNGPYO
- 신랑 아버지: 홍상민
- 신랑 어머니: 정미경
- 관계 문구: 홍상민 · 정미경의 아들 승표
- 신부: 제희
- 신부 영문: JEHEE
- 신부 아버지: 이현규
- 신부 어머니: 장대선
- 관계 문구: 이현규 · 장대선의 딸 제희

### 2.2 초대 문구

```text
비가 쏟아지던 어느 여름날
운명처럼 만난 소년과 소녀는
멀어진 거리와 시간 속에서도
서로를 향한 마음을 이어오며
이제 하나의 길을 함께 걷고자 합니다.
이 길의 시작을 따뜻하게 축복해주시면 감사하겠습니다.
```

문구 내용은 임의로 재작성하지 않는다. 디자인상 줄바꿈과 행간만 조정한다.

### 2.3 예식 정보

- 2026년 10월 31일 토요일
- 낮 12시
- 라마다프라자수원호텔 3층
- 주소: 경기도 수원시 팔달구 중부대로 150

### 2.4 교통 원문

```text
자가용
라마다프라자수원호텔 주차장 이용 가능

KTX
수원역(4번출구) 하차 후 버스 환승
동수원병원, 라마다프라자수원호텔 앞 하차

택시
수원역(4번출구)에서 호텔까지 약 10분

버스
잠실역 1007-1 / 사당역 7000, 7001 / 강남역 3007
아주대.아주대학교병원 앞 하차 후 시내버스 환승
```

모바일에서는 이 문장을 그대로 길게 늘어놓지 않고, `자가용 / 수원역·택시 / 광역버스`처럼 빠르게 찾을 수 있는 정보 구조로 재구성한다.

---

# 3. 현재 1차 구현 상태

현재 브랜치: `feat/initial-wedding-invitation`

현재 기술 스택:

- React
- TypeScript
- Vite
- CSS
- GitHub
- Cloudflare Pages 배포 예정

현재 구현된 기능:

- 모바일 중심 단일 페이지
- Hero
- 실제 초대 문구
- 신랑/신부 및 혼주 정보
- 예식 날짜 및 D-Day
- 2026년 10월 달력
- 사진 교체형 Hero/Gallery
- 라마다프라자수원호텔 위치 섹션
- 카카오맵 길찾기 링크
- 네이버 지도 링크
- 주소 복사
- 자가용/수원역·택시/광역버스 안내
- Web Share API 기반 기본 공유
- 스크롤 reveal animation
- 사진 lazy loading
- `prefers-reduced-motion` 대응 기반

현재 `wedding.ts`의 기능 플래그 중 아래 기능은 아직 실제 구현 전이다.

- contacts
- accounts
- rsvp
- guestbook
- music

빌드는 Windows 환경에서 `npm run build` 성공 확인 완료.

---

# 4. 현재 구현에서 반드시 수정할 문제

## 4.1 오렌지 UI 과사용

현재 CSS에서 오렌지가 다음 요소에 반복 사용된다.

- Hero 오렌지 블록
- 신랑/신부 사이 `&`
- 날짜
- section index
- D-Day
- 달력 선택일
- Gallery quote block
- Location map line
- 카카오맵 버튼
- 기타 강조 텍스트

사진 자체가 블랙/오렌지 계열일 가능성이 있으므로 UI까지 오렌지를 반복하면 전체 화면이 테마형/템플릿형으로 보일 수 있다.

### 수정 원칙

오렌지를 **UI 브랜드 컬러로 사용하지 않는다.**

사진 속 오렌지는 사진 자체의 포인트로 남기고, UI는 거의 무채색으로 정리한다.

---

## 4.2 Hero 글자와 사진 겹침

현재 `.hero__names`는 사진 아래에서 `margin-top: -58px`로 올라오며 사진과 의도적으로 겹친다.

실제 사진을 적용한 뒤에는 이름이 사라지는 것이 아니다. `SEUNGPYO & JEHEE`는 계속 표시되기 때문에 얼굴, 의상, 부케 등 주요 피사체와 충돌할 수 있다.

반면 현재 빈 사진에 표시되는 `WEDDING EDITORIAL / PHOTO 00 / Replace later...` 문구는 `PhotoFrame`의 개발용 placeholder 문구이며 실제 `src`가 들어오면 없어지는 구조다.

### 최종 수정

- Hero 이름과 사진을 기본적으로 독립된 안전 영역에 배치한다.
- 사진 위 텍스트가 필요하다면 고정 위치가 아니라 이미지별 focal point / safe area 설정을 적용한다.
- 실제 사진에서는 개발용 `WEDDING EDITORIAL`, `PHOTO 00`, `Replace later` 문구가 절대 노출되지 않게 한다.
- Production에서 이미지가 누락된 경우에도 개발 문구를 보여주지 않는다.

---

## 4.3 Gallery 개발 문구 제거

현재 다음 문구는 개발 설명이므로 최종 사용자에게 노출하면 안 된다.

```text
웨딩 화보
흑백과 블랙·오렌지 톤의 웨딩 사진을 기준으로 구성한 에디토리얼 갤러리입니다.
사진은 나중에 파일만 교체하면 같은 레이아웃으로 바로 반영됩니다.
```

### 최종 후보

Eyebrow:

```text
Our Moments
```

Title:

```text
우리의 순간
```

Intro 후보:

```text
함께 지나온 시간 속,
오래 기억하고 싶은 순간들을 담았습니다.
```

실제 사진 배치 후 intro가 없어야 더 세련되면 과감히 제거한다.

---

# 5. 최종 디자인 시스템

## 5.1 디자인 키워드

- Editorial
- Modern Wedding
- Quiet Luxury
- Minimal
- Black & White
- Warm Ivory
- Generous Whitespace
- Photography First

화려한 장식, 꽃 아이콘, 과도한 라운드 카드, 핑크/골드 계열의 일반적인 웨딩 템플릿 느낌은 사용하지 않는다.

---

## 5.2 Color System

### 기본 팔레트

```css
--color-paper: #F7F5F1;
--color-paper-soft: #FBFAF7;
--color-ink: #171717;
--color-charcoal: #2B2A28;
--color-text-subtle: #77736D;
--color-line: #DCD8D1;
--color-line-dark: rgba(255, 255, 255, 0.18);
--color-dark-section: #171717;
--color-white: #FFFFFF;
```

정확한 값은 실제 사진 3~5장을 적용한 뒤 다시 색보정한다.

### 원칙

- UI accent orange 제거
- 버튼은 black / ivory / transparent 위주
- 활성 상태는 색보다 배경 반전, underline, border, opacity로 표현
- 사진 속 오렌지가 자연스럽게 유일한 컬러 포인트가 되게 한다.

---

## 5.3 Typography

방향:

- English display: editorial serif
- Korean heading: 단정한 serif
- 본문/UI: 가독성 높은 sans-serif

권장 조합:

- English: Cormorant Garamond 계열
- Korean heading: Noto Serif KR 계열
- UI/body: Pretendard 또는 Noto Sans KR 계열

원칙:

- 이름은 크지만 사진보다 앞서지 않는다.
- 영문 대문자 letter-spacing은 작은 label에만 사용한다.
- 한글 초대 문구는 자간을 과도하게 줄이지 않는다.
- 본문 최소 실사용 크기는 대체로 14~16px 수준을 확보한다.
- 기능 버튼 텍스트는 12px 이하로 지나치게 작아지지 않게 한다.

---

## 5.4 Layout

최종 페이지는 PC 웹을 축소하는 것이 아니라 **모바일용 독립 레이아웃**으로 설계한다.

기본 container:

```css
.invitation-shell {
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
}
```

PC/태블릿에서는 520px 전후의 청첩장 canvas를 중앙 배치하고, 배경은 neutral gray/black 등으로 처리한다.

---

# 6. 최종 Hero 디자인

## 목표

첫 2초 안에 다음 3가지만 인식되어야 한다.

1. 두 사람의 사진
2. 승표 & 제희
3. 2026.10.31

개발 용어 또는 설명문은 없어야 한다.

## 권장 구조

```text
┌─────────────────────────┐
│  2026 · OCTOBER · 31    │  small meta
│                         │
│                         │
│      HERO PHOTO         │
│                         │
│                         │
└─────────────────────────┘

     SEUNGPYO
        &
       JEHEE

승표 · 제희
2026. 10. 31 SAT · 12:00
RAMADA PLAZA SUWON
```

또는 사진 구도가 허용할 때 일부 텍스트를 사진 여백에 배치할 수 있다.

### 중요한 구현 규칙

- 텍스트가 얼굴 위로 올라가지 않는다.
- `object-position`을 이미지별로 설정 가능하게 한다.
- 예: `heroPosition: '50% 35%'`
- 필요 시 mobile 별도 crop 이미지 지원
- Hero height를 고정 px로 잡지 않고 `aspect-ratio`, `svh`, `clamp()`로 구성
- 노치/다이내믹 아일랜드 영역과 겹치지 않게 safe-area 적용

---

# 7. 최종 페이지 섹션 순서

권장 순서는 다음과 같다.

1. Hero
2. Invitation
3. Couple / Family / Contact
4. Wedding Date / Calendar / D-Day
5. Gallery
6. Location / Map / Transportation
7. RSVP
8. Account
9. Guestbook
10. Share / Closing

BGM은 별도 섹션이 아니라 작은 floating control로 제공한다.

---

# 8. 반응형 / 최신 모바일 대응 계획

## 8.1 원칙

특정 iPhone/Galaxy 모델에 종속되는 CSS를 작성하지 않는다.

다음 기능을 사용해 fluid하게 대응한다.

- `min()`
- `max()`
- `clamp()`
- `aspect-ratio`
- CSS Grid/Flex
- `svh`
- 필요한 경우 `dvh`
- `env(safe-area-inset-*)`
- media query는 레이아웃이 실제로 깨지는 지점에만 사용

## 8.2 지원 폭

최소 목표:

- 320px
- 344px
- 360px
- 375px
- 390px
- 393px
- 412px
- 430px
- 480px
- 520px+
- 768px tablet preview

특히 344px 전후는 접힌 폴더블/좁은 Android 화면을 고려한다.

## 8.3 Fluid spacing

예:

```css
:root {
  --page-gutter: clamp(18px, 5vw, 28px);
  --section-space: clamp(72px, 18vw, 112px);
  --title-size: clamp(30px, 9vw, 46px);
}
```

현재의 `84px`, `122px`, `100px`, `410px` 같은 고정값은 필요한 경우 유동값으로 바꾼다.

## 8.4 사진

고정 height 대신 다음을 우선한다.

```css
aspect-ratio: 4 / 5;
```

또는 사진별 ratio config:

- portrait: 4:5
- editorial tall: 3:4
- landscape: 3:2
- square: 1:1

`object-fit: cover` + `object-position`을 data config에서 제어한다.

## 8.5 Safe Area

`index.html` viewport에 `viewport-fit=cover`를 적용하고 fixed UI에는 다음을 사용한다.

```css
padding-bottom: max(16px, env(safe-area-inset-bottom));
```

상단/좌우도 필요한 fixed element에 동일하게 적용한다.

## 8.6 Dynamic viewport

- Hero: 안정적인 첫 화면을 위해 `svh` 기반
- Bottom sheet / modal: 현재 보이는 화면 높이에 맞춰 `dvh` 활용
- 단순 `100vh` 의존 제거

## 8.7 입력 폼

- iOS 자동 zoom 방지를 위해 input/select/textarea는 기본 16px 확보
- keyboard가 열린 상태에서도 submit 버튼 접근 가능
- bottom sheet는 keyboard 높이를 고려한 scroll container 사용

---

# 9. UX/UI 개선 항목

## 9.1 Navigation philosophy

청첩장은 일반 웹앱처럼 상단 메뉴를 두지 않는다.

사용자는 위에서 아래로 자연스럽게 읽는다.

필요한 utility만 floating control로 제공한다.

- BGM
- Share

필요하면 일정 부분 스크롤 후 나타나도록 한다.

---

## 9.2 Touch target

버튼/아이콘은 최소 스펙보다 여유 있게 **44~48px 수준의 실제 터치 영역**을 목표로 한다.

작은 아이콘을 보이게 하더라도 클릭 영역 자체는 충분히 크게 만든다.

---

## 9.3 Scroll animation

현재 reveal animation은 유지하되 과하지 않게 수정한다.

권장:

- opacity 0 → 1
- translateY 12~20px → 0
- 500~800ms
- section마다 stagger를 최소한으로 적용

금지:

- 큰 parallax
- 지나친 rotate
- scroll-jacking
- 스크롤할 때 사진이 과도하게 흔들리는 효과

`prefers-reduced-motion`에서는 transition/animation을 제거한다.

---

## 9.4 Toast

주소/계좌/URL 복사 후 공통 toast 사용.

예:

- `주소가 복사되었습니다.`
- `계좌번호가 복사되었습니다.`
- `청첩장 주소가 복사되었습니다.`

화면 하단 safe-area 바로 위에 표시하고 1.8~2.2초 후 자동 종료한다.

---

## 9.5 Modal / Bottom Sheet

다음 기능은 페이지를 길게 늘리지 않고 bottom sheet 또는 modal을 활용할 수 있다.

- 연락처
- 계좌번호
- RSVP
- Gallery 상세

모바일 우선이므로 desktop modal보다 bottom sheet UX를 우선 검토한다.

규칙:

- backdrop 클릭으로 닫기
- X 버튼 제공
- ESC 지원
- body scroll lock
- focus trap
- `aria-modal`

---

# 10. Invitation / Family / Contact

## Invitation

현재 실제 문구 유지.

너무 많은 장식 없이 중앙 정렬/여백/serif typography로 감성을 만든다.

## Family

현재 `부모 · 부모 / 의 아들 / 이름` 구조는 작은 화면에서 3열 grid가 답답해질 수 있다.

최종안은 320px에서도 자연스럽도록 flex 또는 2단 line으로 변경한다.

예:

```text
홍상민 · 정미경의 아들  승표
이현규 · 장대선의 딸    제희
```

또는 모바일 소폭에서 자동 줄바꿈.

## Contact

최종 기능에 포함한다.

- 신랑에게 연락하기
- 신부에게 연락하기
- 신랑측 혼주 연락처
- 신부측 혼주 연락처

각 사람별:

- 전화 `tel:`
- 문자 `sms:`

실제 전화번호는 아직 제공되지 않았으므로 `wedding.ts`에 데이터 구조를 먼저 만들고, 번호가 입력될 때 활성화한다.

---

# 11. Wedding Date / Calendar

포함 기능:

- 2026.10.31
- 토요일 낮 12시
- D-Day
- 달력에서 31일 강조
- 라마다프라자수원호텔 3층
- 캘린더에 일정 추가

## Calendar Add

완성형에 포함한다.

우선순위:

1. `.ics` 생성/다운로드
2. Google Calendar link

Apple Calendar, Samsung Calendar 등은 `.ics`로 자연스럽게 연결하도록 한다.

D-Day는 페이지를 며칠 동안 켜둔 특수 케이스까지 고려하면 자정에 재계산하도록 개선 가능하다.

---

# 12. Gallery

## UI

현재 editorial grid 방향은 유지하되 오렌지 quote block은 제거한다.

대안:

- full bleed photo
- white margin photo
- 2-column asymmetric grid
- 짧은 serif quote는 neutral dark/ivory block

실제 사진 비율과 구도를 본 뒤 순서를 최종 확정한다.

## 기능

- 사진 lazy loading
- Hero는 eager/high priority
- Gallery 클릭 시 lightbox
- 좌우 swipe
- 현재 사진 index
- close
- pinch zoom은 브라우저 기본 확대를 방해하지 않는 선에서 검토

드래그만으로 이동하게 만들지 않고 버튼/탭 방식도 제공한다.

## 이미지 데이터

예정 구조:

```ts
images: {
  hero: {
    src: '/images/hero/hero-main.webp',
    position: '50% 35%',
  },
  gallery: [
    {
      src: '/images/gallery/gallery-01.webp',
      alt: '...',
      ratio: '4/5',
      position: '50% 50%',
    },
  ],
}
```

이렇게 하여 사진 교체 시 CSS 수정 없이 data 파일만 바꾼다.

---

# 13. Location / Map / Transportation

현재 가짜 map-like graphic만 보여주는 방식에서 최종적으로 실제 사용성이 있는 위치 영역으로 개선한다.

## 상단

```text
라마다프라자수원호텔
3층
경기도 수원시 팔달구 중부대로 150
```

## 지도

Kakao Map JavaScript SDK 적용을 우선 검토한다.

- 호텔 marker
- 과도한 지도 UI는 숨기거나 최소화
- map container height는 responsive
- 지도 로딩 실패 시 주소 카드와 외부 지도 버튼은 그대로 사용 가능해야 한다.

## 외부 길찾기

버튼 후보:

- 카카오맵
- 네이버지도
- TMAP
- 주소 복사

T맵은 실제 production universal/deep link 동작을 기기별 검증 후 적용한다.

## 교통 카드

### 자가용

라마다프라자수원호텔 주차장 이용 가능

### 수원역 · 택시

- KTX 수원역 4번 출구 하차 후 버스 환승
- 동수원병원 · 라마다프라자수원호텔 앞 하차
- 택시 이용 시 수원역 4번 출구에서 호텔까지 약 10분

### 광역버스

- 잠실역: 1007-1
- 사당역: 7000, 7001
- 강남역: 3007
- 아주대 · 아주대학교병원 앞 하차 후 시내버스 환승

숫자와 정류장명에 시각적 hierarchy를 줘서 한눈에 읽게 한다.

---

# 14. 축의금 계좌 / 마음 전하실 곳

완성형에 포함한다.

## UX

기본 상태에서는 계좌번호를 길게 노출하지 않는다.

```text
마음 전하실 곳

[ 신랑측 계좌 보기 ]
[ 신부측 계좌 보기 ]
```

accordion 확장 후:

```text
국민은행
123456-00-000000
예금주 홍OO
[계좌번호 복사]
```

## 기능

- 신랑측 / 신부측 분리
- 필요하면 혼주 계좌 추가
- 은행명
- 계좌번호
- 예금주
- 개별 복사 버튼
- 성공 toast

실제 계좌 정보는 아직 제공되지 않았으므로 데이터만 나중에 입력한다.

계좌 데이터는 공개 웹페이지에 포함되는 정보라는 점을 인지하고 최종 공개 여부를 확인한 뒤 활성화한다.

---

# 15. RSVP 참석 여부

완성형 기능에 포함한다.

## Frontend form

필드:

- 이름 (필수)
- 신랑측 / 신부측 (필수)
- 참석 / 불참 (필수)
- 참석 인원 (참석 시 필수)
- 식사 여부: 예정 / 미정 / 안 함
- 전달사항 (선택)

가능하면 불필요한 개인정보인 전화번호는 수집하지 않는다.

## UX

- 페이지 내부 CTA: `참석 여부 전달하기`
- bottom sheet 또는 별도 section form
- 제출 중 spinner
- 중복 submit 방지
- 성공 화면
- 실패 시 입력값 유지
- 네트워크 오류 메시지
- required field inline validation

## Backend

Cloudflare Pages Functions + D1 사용.

예정 API:

```text
POST /api/rsvp
```

D1 예시:

```sql
CREATE TABLE rsvp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  side TEXT NOT NULL,
  attendance TEXT NOT NULL,
  guest_count INTEGER,
  meal TEXT,
  message TEXT,
  created_at TEXT NOT NULL
);
```

서버에서 enum/길이/인원 범위를 다시 검증한다.

---

# 16. Guestbook 방명록

완성형에 포함한다.

## 기능

- 이름
- 축하 메시지
- 신랑측/신부측 선택은 선택사항
- 등록
- 최신 글 목록
- 더 보기
- 본인 글 삭제

## UI

방명록은 SNS 피드처럼 보이지 않게 한다.

짧은 메시지 카드/리스트 형태로 만들고 웨딩 전체 디자인과 동일한 typography를 사용한다.

## 삭제

등록 시 짧은 삭제 비밀번호를 받는 방식을 검토한다.

서버에는 평문 비밀번호를 저장하지 않는다.

## Spam 방지

- Cloudflare Turnstile
- server-side validation
- HTML/script 제거
- 최대 글자수 제한
- 과도한 반복 요청 방지
- `visible` flag를 두어 관리자가 숨길 수 있게 한다.

D1 예시:

```sql
CREATE TABLE guestbook (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  side TEXT,
  message TEXT NOT NULL,
  delete_hash TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
```

---

# 17. BGM

완성형에 포함한다.

## 원칙

페이지 진입 즉시 소리가 강제로 나지 않는다.

모바일 브라우저의 autoplay 정책상 사용자 interaction 없이 audible audio 재생은 차단될 수 있으므로 사용자 컨트롤을 기본으로 한다.

## UI

작은 floating button:

```text
♪
```

상태:

- play
- pause
- loading
- unavailable

## UX

- 첫 탭 후 재생
- 재생 상태 시 subtle animation 가능
- `aria-label="배경음악 재생" / "배경음악 일시정지"`
- 새로고침 시 자동 강제 재생하지 않는다.
- 필요하면 `sessionStorage`로 사용자의 선택만 기억한다.

## 파일

예:

```text
public/audio/wedding-bgm.mp3
```

저작권 문제가 없는 음원 또는 사용 권리를 확보한 파일만 배포한다.

음원이 아직 없으면 production에서 컨트롤을 숨긴다.

---

# 18. Share

공유 기능은 3단계로 제공한다.

## 18.1 카카오톡 공유

전용 `카카오톡 공유` 버튼 구현.

Kakao JavaScript SDK 사용.

환경변수:

```text
VITE_KAKAO_JS_KEY
```

키는 코드에 하드코딩하지 않는다.

필요 설정:

- Kakao Developers 앱
- JavaScript key
- Web domain 등록
- 공유 template 또는 default/scrap template

권장 공유 카드:

```text
[대표 웨딩 사진]
승표 ♥ 제희, 결혼합니다
2026년 10월 31일 토요일 낮 12시
라마다프라자수원호텔 3층
[모바일 청첩장 보기]
```

## 18.2 URL 복사

독립 버튼으로 제공한다.

- 성공 toast
- Clipboard API 실패 시 fallback

## 18.3 OS Native Share

지원 브라우저에서는 Web Share API를 보조 fallback으로 유지할 수 있다.

---

# 19. Open Graph / 링크 미리보기

카카오톡, 문자, SNS에 링크를 붙였을 때 예쁘게 보여야 한다.

필수 meta:

- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `og:type`

대표 문구 후보:

```text
승표 & 제희, 결혼합니다
2026.10.31 SAT · 라마다프라자수원호텔
```

OG 이미지는 별도 1200×630 이미지로 제작한다.

```text
public/images/og/og-main.jpg
```

대표 사진을 단순 crop하는 것보다 이름/날짜가 포함된 전용 OG 이미지를 권장한다.

---

# 20. 사진 교체 / 이미지 최적화

사진은 언제든 교체 가능하게 유지한다.

원본 고해상도 파일을 GitHub에 그대로 넣지 않는다.

## 권장 파일

Hero:

- 1600~2000px 수준
- WebP 또는 AVIF
- 고화질 JPEG fallback은 필요 시 검토

Gallery:

- 긴 변 기준 1400~1800px 정도
- WebP/AVIF

OG:

- 1200×630 JPG/WebP

## 성능

- Hero preload / fetchpriority high 검토
- Gallery `loading="lazy"`
- decoding async
- width/height 또는 aspect-ratio 사전 지정 → CLS 방지
- 과도한 원본 파일 사용 금지

## 색감

UI에서 모든 사진에 강제 grayscale filter를 걸지 않는다.

사진 작가/보정본의 원래 색감을 최대한 유지한다.

필요한 경우 개별 사진 설정으로만 필터를 적용한다.

---

# 21. Data 구조 개선

현재 `wedding.ts` 한 파일에서 대부분 관리하는 방향은 유지한다.

최종적으로 다음 데이터를 포함한다.

```text
couple
parents
contacts
invitation
ceremony
images
map
transport
accounts
rsvp options
share
music
features
```

예상 구조:

```ts
export const wedding = {
  couple: { ... },
  contacts: { ... },
  invitation: [...],
  ceremony: { ... },
  images: { ... },
  location: { ... },
  transport: [...],
  accounts: {
    groom: [...],
    bride: [...],
  },
  share: { ... },
  music: { ... },
  features: { ... },
};
```

민감한 서버 secret은 이 파일에 넣지 않는다.

---

# 22. Component 구조 개선

현재 큰 `App.tsx`를 최종 기능 추가 전에 section별로 나눈다.

예정:

```text
src/
├─ components/
│  ├─ common/
│  │  ├─ Button.tsx
│  │  ├─ Modal.tsx
│  │  ├─ BottomSheet.tsx
│  │  ├─ Toast.tsx
│  │  └─ SectionHeading.tsx
│  ├─ HeroSection.tsx
│  ├─ InvitationSection.tsx
│  ├─ FamilySection.tsx
│  ├─ DateSection.tsx
│  ├─ GallerySection.tsx
│  ├─ LocationSection.tsx
│  ├─ RsvpSection.tsx
│  ├─ AccountSection.tsx
│  ├─ GuestbookSection.tsx
│  ├─ ShareSection.tsx
│  ├─ MusicControl.tsx
│  └─ FloatingActions.tsx
├─ data/
│  └─ wedding.ts
├─ hooks/
├─ lib/
├─ styles/
└─ App.tsx
```

목표는 App.tsx가 전체 순서만 읽히도록 만드는 것이다.

---

# 23. Cloudflare Backend 구조

예정:

```text
functions/
└─ api/
   ├─ rsvp.ts
   └─ guestbook/
      ├─ index.ts
      └─ delete.ts

database/
└─ schema.sql
```

Cloudflare Pages Functions에서 D1 binding 사용.

예:

```text
WEDDING_DB
```

secret/environment:

```text
TURNSTILE_SECRET_KEY
VITE_TURNSTILE_SITE_KEY
VITE_KAKAO_JS_KEY
```

`VITE_`로 시작하는 값은 브라우저에 노출되는 public 값만 사용한다.

secret key는 Cloudflare environment에만 저장한다.

---

# 24. Security / Privacy

## RSVP

- 필요한 정보만 수집
- 전화번호는 꼭 필요하지 않으면 저장하지 않음
- DB write server validation
- 최대 길이 제한
- 입력값 sanitize/normalize

## Guestbook

- HTML을 렌더링하지 않음
- plain text로만 표시
- script injection 차단
- Turnstile
- delete password hash
- rate abuse 대응

## Secrets

다음은 GitHub에 commit 금지.

- Cloudflare API token
- Turnstile secret
- 관리자 secret
- 기타 private key

`.env.example`에는 key 이름만 기록한다.

---

# 25. Accessibility

목표는 디자인을 해치지 않으면서 기본 접근성을 갖추는 것이다.

- semantic HTML
- 명확한 heading hierarchy
- 사진 alt
- decorative image는 빈 alt
- 버튼 실제 `<button>` 사용
- 링크/버튼 keyboard focus 표시
- 최소 터치 target 확보
- 충분한 contrast
- `prefers-reduced-motion`
- modal focus 관리
- form label
- error text 연결
- `aria-live` toast/status

색상만으로 상태를 구분하지 않는다.

---

# 26. Performance 목표

청첩장은 카카오톡 링크를 눌렀을 때 빠르게 떠야 한다.

우선순위:

1. HTML/CSS/JS 빠른 첫 렌더
2. Hero 이미지 빠른 표시
3. Gallery 지연 로드
4. Map/Guestbook/Kakao SDK는 필요한 시점에 늦게 로드

권장 전략:

- route library 불필요
- 무거운 UI library 최소화
- animation library도 필요하지 않으면 CSS/작은 hook으로 처리
- Kakao Map SDK lazy load
- Kakao Share SDK 필요 시 load
- image compression
- code splitting이 실익 있는 기능만 적용

---

# 27. Browser / Device 테스트 매트릭스

## Browser

필수:

- iOS Safari
- Android Chrome
- Samsung Internet
- KakaoTalk in-app browser

권장:

- Naver in-app browser
- desktop Chrome
- desktop Edge

## Viewport

개발자 도구 및 실제 기기에서 다음 폭을 확인한다.

```text
320
344
360
375
390
393
412
430
480
520
768
```

## 체크 항목

각 화면에서:

- 가로 overflow 없음
- 이름/날짜 잘림 없음
- Hero 얼굴 위 text 침범 없음
- 초대 문구 자연스러운 줄바꿈
- Family 정보 줄바꿈 정상
- Calendar 7열 정상
- Gallery gap/ratio 정상
- 지도 높이 정상
- transport 숫자/문구 겹침 없음
- 계좌 accordion 정상
- form keyboard 사용 가능
- modal/bottom sheet safe area 정상
- toast home indicator 위 노출
- BGM 버튼 겹침 없음
- Kakao share 정상

---

# 28. UX 테스트 시나리오

### 시나리오 A — 카카오톡으로 처음 방문

1. 링크 탭
2. Hero 1~2초 이내 표시
3. 이름/날짜 확인
4. 아래로 스크롤
5. 사진 감상
6. 위치 확인
7. 카카오맵 열기
8. RSVP 제출
9. 계좌 복사
10. 방명록 작성

중간에 뒤로 가거나 앱 전환 후 돌아와도 UI가 망가지지 않아야 한다.

### 시나리오 B — 부모님 세대

1. 글자가 지나치게 작지 않음
2. 길찾기 버튼 명확함
3. 계좌 복사 버튼 명확함
4. 참석 여부 입력이 복잡하지 않음
5. 잘못 눌러도 입력값이 사라지지 않음

### 시나리오 C — 사진 위주로 보는 사용자

1. Hero가 즉시 보임
2. Gallery 로딩이 자연스러움
3. 사진 눌러 크게 보기
4. swipe/닫기 쉬움

---

# 29. 구현 우선순위

## Phase 1 — 디자인 리뉴얼 / 코드 정리

- [ ] Orange UI 제거
- [ ] Color token 재정의
- [ ] Hero 레이아웃 재설계
- [ ] 이름/사진 overlap 제거
- [ ] production placeholder 정책 변경
- [ ] Gallery 최종 문구 적용
- [ ] Section typography 통일
- [ ] App.tsx section component 분리
- [ ] global CSS token/section 구조 정리

## Phase 2 — Responsive 완성

- [ ] viewport-fit=cover
- [ ] safe-area 적용
- [ ] spacing clamp 적용
- [ ] typography clamp 적용
- [ ] fixed height → aspect-ratio/fluid 변환
- [ ] 320~430px 폭 검증
- [ ] foldable 좁은 폭 검증
- [ ] tablet/desktop center canvas 검증
- [ ] input 16px / keyboard 대응

## Phase 3 — 기본 완성 기능

- [ ] 연락처
- [ ] 캘린더 추가
- [ ] Gallery lightbox/swipe
- [ ] 지도 개선
- [ ] 카카오/네이버/TMAP 외부 길찾기
- [ ] 주소 복사
- [ ] 계좌 accordion
- [ ] 계좌 복사
- [ ] URL 복사
- [ ] native share

## Phase 4 — Dynamic 기능

- [ ] Cloudflare Pages Functions
- [ ] D1 schema
- [ ] RSVP API/UI
- [ ] Guestbook API/UI
- [ ] Turnstile
- [ ] server-side validation
- [ ] error/loading/success UX

## Phase 5 — Media / Sharing

- [ ] BGM player
- [ ] 실제 음원 연결
- [ ] Kakao JavaScript SDK
- [ ] 카카오톡 공유 template
- [ ] OG metadata
- [ ] OG 대표 이미지

## Phase 6 — 실제 사진 반영

- [ ] Hero 선정
- [ ] Gallery 사진 선정
- [ ] WebP/AVIF 변환
- [ ] 각 사진 focal point 설정
- [ ] 화면별 crop 검증
- [ ] UI palette 미세 보정

## Phase 7 — Production QA

- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Samsung Internet
- [ ] Kakao in-app browser
- [ ] Naver in-app browser
- [ ] 320~430px viewport
- [ ] network slow test
- [ ] image loading test
- [ ] API error test
- [ ] Turnstile test
- [ ] account copy test
- [ ] map app link test
- [ ] BGM user gesture test
- [ ] share card test

## Phase 8 — 배포

- [ ] Cloudflare Pages 연결
- [ ] preview deployment
- [ ] D1 production binding
- [ ] environment variables
- [ ] custom domain
- [ ] Kakao web domain 등록
- [ ] final noindex/index 정책 결정
- [ ] 최종 링크 테스트

---

# 30. 아직 필요한 실제 정보

기능은 먼저 구현할 수 있지만 최종 활성화를 위해 아래 정보가 필요하다.

## 사진

- Hero 후보 2~3장
- Gallery 후보 8~15장
- OG용 대표 사진

## 연락처

- 신랑 전화번호
- 신부 전화번호
- 필요 시 양가 혼주 전화번호

## 계좌

- 신랑측 은행 / 계좌 / 예금주
- 신부측 은행 / 계좌 / 예금주
- 필요 시 혼주 계좌

## BGM

- 최종 음원 파일
- 웹 공개 사용 권리 확인

## Kakao

- Kakao Developers JavaScript key
- 최종 production domain

위 값이 아직 없어도 UI/component/API 개발은 진행 가능하다.

---

# 31. Definition of Done

이 프로젝트는 단순히 빌드가 성공하는 것만으로 완료로 보지 않는다.

아래를 모두 만족해야 최종 완료다.

### 디자인

- [ ] 사진보다 UI가 튀지 않는다.
- [ ] 오렌지를 UI 테마 컬러로 사용하지 않는다.
- [ ] Hero의 이름과 사진 주요 피사체가 겹치지 않는다.
- [ ] 개발용 문구가 전혀 노출되지 않는다.
- [ ] 전체가 하나의 웨딩 에디토리얼처럼 보인다.

### Responsive

- [ ] 320px에서도 깨지지 않는다.
- [ ] 430px 대형 모바일에서도 지나치게 벌어지지 않는다.
- [ ] safe-area 문제 없다.
- [ ] Kakao in-app browser에서 정상이다.

### 기능

- [ ] 연락처
- [ ] D-Day
- [ ] Calendar
- [ ] Calendar Add
- [ ] Gallery lightbox
- [ ] 지도/길찾기
- [ ] 주소 복사
- [ ] 계좌 보기/복사
- [ ] RSVP
- [ ] Guestbook
- [ ] BGM
- [ ] Kakao share
- [ ] URL copy
- [ ] Native share fallback

### 품질

- [ ] production build 성공
- [ ] console error 없음
- [ ] form validation 정상
- [ ] API error handling 정상
- [ ] 이미지 누락 시 레이아웃 붕괴 없음
- [ ] slow network에서도 기본 콘텐츠 확인 가능
- [ ] 키보드/스크린리더 기본 접근성 확보

---

# 32. 최종 방향 한 문장

> **승표와 제희의 흑백/블랙·오렌지 웨딩 화보가 주인공이 되고, UI는 오프화이트와 블랙 중심으로 절제된 웨딩 매거진처럼 보이면서도 지도·계좌·RSVP·방명록·음악·공유가 자연스럽게 동작하는 완성형 모바일 청첩장.**

이 문장을 이후 디자인과 기능 결정의 기준으로 사용한다.

---

# 33. 기술 참고 링크

- MDN CSS viewport units: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
- MDN CSS safe-area env(): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env
- MDN media autoplay: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- KakaoTalk Share JavaScript: https://developers.kakao.com/docs/ko/kakaotalk-share/js-link
- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- Cloudflare Pages D1 bindings: https://developers.cloudflare.com/pages/functions/bindings/
