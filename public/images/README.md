# Wedding image replacement guide

사진은 코드와 분리되어 있습니다. 아래 파일 경로를 사용하면 됩니다.

- `hero/hero-main.webp`: 첫 화면 대표 사진, 세로 4:5 또는 3:4 권장
- `gallery/gallery-01.webp` ~ `gallery-06.webp`: 갤러리 사진
- `og/og-main.jpg`: 카카오톡/메신저 공유 미리보기 이미지, 1200x630 권장

초기 버전에서는 `src/data/wedding.ts`의 이미지 경로가 빈 문자열이라 디자인 플레이스홀더가 보입니다.
사진을 넣은 뒤 `wedding.ts`에서 해당 경로만 연결하면 레이아웃 수정 없이 교체됩니다.

권장 웹용 이미지:
- 긴 변 1600~2000px
- WebP 또는 AVIF
- 1장당 300~800KB 정도
- 원본 사진은 Public GitHub 저장소에 올리지 않는 것을 권장
