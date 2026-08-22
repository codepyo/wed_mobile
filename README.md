# 승표 & 제희 모바일 청첩장

2026년 10월 31일 토요일 낮 12시, 라마다프라자수원호텔 3층 모바일 청첩장 프로젝트입니다.

## 현재 콘셉트

- Wedding Editorial / Magazine style
- Black & White photography
- Black + Burnt Orange accent
- Mobile first (320~500px)
- 사진과 콘텐츠 데이터 분리
- Cloudflare Pages 배포 기준

## 실행

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

## 가장 자주 수정할 파일

`src/data/wedding.ts`

신랑/신부 이름, 혼주, 초대 문구, 날짜, 장소, 교통, 이미지 경로를 한 파일에서 수정합니다.

## 사진 교체

사진은 나중에 교체할 수 있습니다.

1. `public/images/hero/hero-main.webp` 추가
2. `public/images/gallery/gallery-01.webp` ~ `gallery-06.webp` 추가
3. `src/data/wedding.ts` 이미지 설정 변경

예시:

```ts
images: {
  hero: '/images/hero/hero-main.webp',
  gallery: [
    '/images/gallery/gallery-01.webp',
    '/images/gallery/gallery-02.webp',
    '/images/gallery/gallery-03.webp',
    '/images/gallery/gallery-04.webp',
    '/images/gallery/gallery-05.webp',
    '/images/gallery/gallery-06.webp',
  ],
  og: '/images/og/og-main.jpg',
}
```

## 배포 - Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git

- Repository: `codepyo/wed_mobile`
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

`main` 브랜치에 push하면 자동 배포되도록 설정합니다.

## 구현된 기능

- 모바일 에디토리얼 Hero
- 실제 초대 문구
- 양가 혼주/신랑신부 정보
- D-Day 자동 계산
- 2026년 10월 달력 + 31일 강조
- 교체 가능한 갤러리 6장
- 라마다프라자수원호텔 Location
- 카카오맵 길찾기
- 네이버 지도 검색
- 주소 복사
- 자가용 / 수원역·택시 / 광역버스 안내
- Web Share API 기반 공유
- 검색엔진 noindex 설정
- Reduce Motion 접근성 대응

## 다음 단계 후보

- 실제 웨딩 사진 반영 후 톤/크롭 최적화
- 카카오톡 전용 공유 SDK
- 연락처 섹션
- 마음 전하실 곳(계좌) Accordion
- 참석 여부 RSVP + Cloudflare D1
- 필요 시 방명록 + Turnstile
- 커스텀 도메인 연결
