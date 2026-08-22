# 승표 & 제희 모바일 청첩장

2026년 10월 31일 토요일 낮 12시, 라마다프라자수원호텔 3층 모바일 청첩장 프로젝트입니다.

## 개발 문서

- 전체 개발 계획: `docs/DEVELOPMENT_PLAN.md`
- 관리자 콘솔 / 운영 설계: `docs/ADMIN_CONSOLE_PLAN.md`

관리자 콘솔은 별도 서버나 별도 SQL 서버를 운영하지 않고 Cloudflare Pages + Pages Functions + D1 + R2 + Access 기반으로 RSVP, 방명록, 통계, 파일, 운영 설정을 관리하는 방향입니다.

## 현재 콘셉트

- Wedding Editorial / Magazine style
- Black & White photography
- Warm Ivory + Ink Black UI
- Mobile first
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

## 주요 데이터

`src/data/wedding.ts`

신랑/신부 이름, 혼주, 초대 문구, 날짜, 장소, 교통, 이미지 경로를 한 파일에서 관리합니다.

## 배포

Cloudflare Pages를 기준으로 합니다.

- Repository: `codepyo/wed_mobile`
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

`main` 브랜치에 push하면 자동 배포되도록 구성할 예정입니다.

## 최종 기능 범위

공개 청첩장:

- Hero / Invitation / Family
- D-Day / Calendar / Calendar Add
- Gallery / Lightbox
- 지도 / 길찾기 / 교통
- 연락처
- 축의금 계좌 / 복사
- RSVP
- 방명록
- BGM
- Kakao Share / URL 복사 / Native Share

관리자 콘솔:

- Cloudflare Access 인증
- RSVP 통계 / 검색 / 필터 / 수정 / 삭제 / 복원
- 예상 참석 인원 / 식사 인원 / 신랑측·신부측 통계
- RSVP CSV 다운로드
- 방명록 숨김 / 삭제 / 복원
- Hero / Gallery / OG / BGM 파일 관리
- Gallery 순서 / focal point 관리
- 기능 ON/OFF
- RSVP 마감일
- 운영 준비 상태
- System status
- Audit log
- 데이터 backup / export
