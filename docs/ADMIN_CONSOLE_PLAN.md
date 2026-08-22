# 승표 & 제희 모바일 청첩장 — 관리자 콘솔 / 운영 설계

> 이 문서는 `docs/DEVELOPMENT_PLAN.md`의 관리자·운영 기능 확장 문서다.
> 최종 배포 후 별도 서버 PC나 별도 MySQL/PostgreSQL/Oracle 서버를 운영하지 않고도 참석 정보, 방명록, 통계, 파일, 공개 설정을 관리할 수 있도록 하는 것을 목표로 한다.
>
> 기본 아키텍처: Cloudflare Pages + Pages Functions + D1 + R2 + Cloudflare Access
> 작성 기준: 2026-08-22

---

# 1. 목표

관리자 화면은 단순히 RSVP 목록을 보는 페이지가 아니라 **결혼식 전 운영 콘솔**로 만든다.

최종적으로 관리자 페이지에서 다음이 가능해야 한다.

- 참석 여부 현황 확인
- 예상 참석 인원 확인
- 신랑측 / 신부측 통계 확인
- 식사 예정 인원 확인
- 참석 응답 검색 / 필터 / 수정 / 삭제
- 방명록 조회 / 숨김 / 삭제
- 사진 / OG 이미지 / BGM 등 파일 관리
- 공개 여부 / 기능 ON·OFF 관리
- CSV 파일 다운로드
- 운영 데이터 백업
- 최근 관리자 작업 내역 확인
- 시스템/API 상태 확인

관리자는 SQL을 직접 실행하거나 Cloudflare Dashboard를 매번 열지 않아도 된다.

---

# 2. 최종 전체 아키텍처

```text
                           GitHub
                      codepyo/wed_mobile
                            │
                            │ push
                            ▼
                  ┌───────────────────┐
                  │ Cloudflare Pages  │
                  │ Wedding Frontend  │
                  └─────────┬─────────┘
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       Public Invitation                 /admin
             │                             │
             │                             ▼
             │                    Cloudflare Access
             │                    관리자 인증 / 차단
             │                             │
             └─────────────┬───────────────┘
                           ▼
                 Cloudflare Pages Functions
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
        Cloudflare D1     Cloudflare R2   Turnstile
        구조화 데이터       파일 저장       Bot 방지
```

별도 상시 서버는 없다.

---

# 3. 서비스별 역할

## Cloudflare Pages

저장 대상:

- React / TypeScript / CSS
- 관리자 React UI
- 정적 fallback 이미지
- 기본 설정

역할:

- 공개 모바일 청첩장 제공
- `/admin` 관리자 SPA 제공
- GitHub push 기반 자동 배포

---

## Pages Functions

역할:

- RSVP 등록/조회/수정/삭제
- Guestbook 등록/조회/숨김/삭제
- Admin dashboard 통계 API
- CSV export
- R2 파일 업로드/삭제/메타데이터 관리
- 공개 사이트 설정 조회/수정
- 관리자 작업 audit log 기록
- 데이터 검증

브라우저가 D1이나 R2에 직접 쓰지 않는다.

```text
Browser
   ↓
/api/*
   ↓
Pages Functions
   ↓
validation / authorization
   ↓
D1 / R2
```

---

## Cloudflare D1

구조화된 운영 데이터를 저장한다.

예:

- RSVP
- Guestbook
- 사이트 설정
- 미디어 메타데이터
- 관리자 작업 로그
- 데이터 export 기록

D1 Free 기준 데이터베이스 최대 크기는 현재 500MB이며, 이 청첩장 규모에는 충분하다.

D1 Time Travel을 이용해 실수로 UPDATE/DELETE 했을 때 일정 기간 내 point-in-time 복구가 가능하도록 운영 절차에 포함한다.

---

## Cloudflare R2

파일 저장소로 사용한다.

저장 후보:

```text
wedding-assets/
├─ hero/
│  └─ hero-main.webp
├─ gallery/
│  ├─ gallery-01.webp
│  └─ ...
├─ og/
│  └─ og-main.jpg
├─ audio/
│  └─ wedding-bgm.mp3
└─ exports/
   └─ rsvp-2026-10-20.csv
```

관리자에서 사진이나 BGM을 교체하면 GitHub commit 없이 바로 반영 가능하도록 만드는 것이 최종 목표다.

R2 Standard free tier는 현재 10GB-month 저장공간과 월별 무료 operation allowance를 제공하며 인터넷 egress 비용이 없다.

웨딩 이미지와 BGM 수준에서는 충분한 규모다.

---

# 4. 관리자 인증

관리자 페이지에 자체 아이디/비밀번호 시스템을 새로 만들지 않는 것을 기본으로 한다.

## 권장: Cloudflare Access

보호 대상:

```text
https://최종도메인/admin*
https://최종도메인/api/admin/*
```

허용 사용자:

- 승표 이메일
- 제희 이메일
- 필요 시 지정된 가족/관리자 이메일

인증 방식 후보:

- Email One-Time PIN
- Google 계정
- GitHub 계정

최종적으로 사용하기 편한 방식을 선택한다.

### 이유

직접 구현 시 필요한 것:

- password hash
- session
- password reset
- brute-force protection
- cookie security
- CSRF 대응

Cloudflare Access를 사용하면 이 인증 계층을 별도로 운영하지 않아도 된다.

Cloudflare Zero Trust Free는 현재 50명 미만 팀에 적합한 무료 플랜을 제공하므로 소수 관리자 용도에 적합하다.

---

# 5. 관리자 메인 Dashboard

관리자 로그인 직후 한 화면에서 중요한 상태를 본다.

## KPI 카드

```text
┌────────────────────┐
│ 전체 응답           │
│ 83건                │
└────────────────────┘

┌────────────────────┐
│ 참석                │
│ 71건 / 96명         │
└────────────────────┘

┌────────────────────┐
│ 불참                │
│ 12건                │
└────────────────────┘

┌────────────────────┐
│ 식사 예정           │
│ 88명                │
└────────────────────┘
```

추가 KPI:

- 신랑측 예상 인원
- 신부측 예상 인원
- 식사 미정
- 최근 24시간 응답
- 방명록 수
- 숨김 처리된 방명록 수

---

# 6. Dashboard 시각화

과한 BI dashboard가 아니라 결혼식 준비에 필요한 차트만 사용한다.

## 차트 1 — 참석 구성

```text
신랑측  ███████████ 53명
신부측  █████████ 43명
```

## 차트 2 — 참석 / 불참

Donut 또는 horizontal bar.

## 차트 3 — 식사 인원

- 식사 예정
- 식사 안 함
- 미정

## 차트 4 — 일자별 RSVP 추이

청첩장 공유 이후 응답이 얼마나 들어오는지 확인한다.

```text
9/01  3
9/02  12
9/03  18
...
```

실시간 websocket 수준은 필요하지 않다.

페이지 진입/새로고침 및 수동 refresh 정도로 충분하다.

---

# 7. RSVP 관리

경로 예시:

```text
/admin/rsvp
```

## Table

```text
이름 | 구분 | 참석 | 인원 | 식사 | 전달사항 | 응답시간
```

## 검색

- 이름 검색
- 메시지/전달사항 검색

## 필터

- 전체
- 신랑측
- 신부측
- 참석
- 불참
- 식사 예정
- 식사 미정
- 식사 안 함

필터 조합 지원.

## 정렬

- 최신순
- 오래된순
- 이름순
- 참석 인원 많은 순

## 관리자 작업

- 상세 보기
- 내용 수정
- 삭제
- soft delete 복원

### 삭제 정책

실수 방지를 위해 실제 DB row를 즉시 hard delete하지 않는다.

예:

```text
status = ACTIVE
status = DELETED
```

관리자 UI에서 삭제는 우선 soft delete한다.

최종 hard delete는 별도 관리 작업으로 둔다.

---

# 8. RSVP 데이터 모델 확장

```sql
CREATE TABLE rsvp (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    side TEXT NOT NULL,
    attendance TEXT NOT NULL,
    guest_count INTEGER,
    meal TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT,
    deleted_at TEXT
);
```

권장 index:

```sql
CREATE INDEX idx_rsvp_created_at ON rsvp(created_at);
CREATE INDEX idx_rsvp_side ON rsvp(side);
CREATE INDEX idx_rsvp_attendance ON rsvp(attendance);
CREATE INDEX idx_rsvp_status ON rsvp(status);
```

청첩장 규모에서는 성능 때문에 필수는 아니지만 명확한 schema를 유지한다.

---

# 9. RSVP 통계 계산 원칙

## 전체 응답 건수

```text
COUNT(status='ACTIVE')
```

## 참석 응답 건수

```text
attendance = YES
```

## 예상 참석 인원

참석 응답의 `guest_count` 합계.

```text
SUM(guest_count)
```

## 신랑측 예상 참석 인원

```text
side = GROOM AND attendance = YES
```

## 식사 예정 인원

식사 예정 응답의 guest_count를 합산한다.

참석자가 3명인데 식사 여부가 YES라면 기본적으로 3명으로 계산한다.

향후 필요한 경우 `meal_count`를 별도 필드로 확장할 수 있다.

---

# 10. RSVP 중복 응답 처리

전화번호 같은 개인정보를 받지 않을 계획이므로 완벽한 동일인 식별은 하지 않는다.

관리자 화면에서 다음을 제공한다.

- 동일 이름 응답 탐지 badge
- 동일 이름 + 동일 side 중복 가능성 표시
- 최근 응답 비교
- 관리자가 병합/삭제 판단

자동으로 기존 응답을 덮어쓰지 않는다.

잘못된 이름 충돌 가능성이 있기 때문이다.

---

# 11. Guestbook 관리

경로:

```text
/admin/guestbook
```

목록:

```text
이름 | 구분 | 메시지 | 상태 | 등록시간
```

관리자 기능:

- 전체 보기
- 공개 중
- 숨김
- 신고/관리 필요
- 검색
- 상세보기
- 숨김 처리
- 숨김 해제
- soft delete

## 운영 원칙

사용자 페이지에서는 `visible = 1`이고 `status = ACTIVE`인 글만 표시한다.

이상한 내용이 있으면 즉시 숨김 처리할 수 있다.

---

# 12. Guestbook 데이터 모델

```sql
CREATE TABLE guestbook (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    side TEXT,
    message TEXT NOT NULL,
    delete_hash TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT,
    deleted_at TEXT
);
```

Admin에서 사용자의 삭제 비밀번호를 볼 수는 없다.

`delete_hash`만 저장한다.

---

# 13. 데이터 Export

관리자에서 버튼 하나로 RSVP를 내려받을 수 있게 한다.

```text
[ CSV 다운로드 ]
```

파일명:

```text
wedding-rsvp-20261020-183000.csv
```

컬럼 예:

```text
이름
구분
참석여부
참석인원
식사여부
전달사항
응답일시
```

Excel에서 한글이 깨지지 않도록 UTF-8 BOM CSV를 고려한다.

## Export 종류

- 전체 RSVP
- 참석자만
- 신랑측
- 신부측
- 식사 인원
- 방명록

필터가 적용된 화면에서 `현재 필터로 다운로드`도 제공한다.

---

# 14. Excel/XLSX 여부

초기에는 CSV만 지원한다.

이유:

- browser / server 의존성 감소
- Excel에서 바로 열 수 있음
- 충분한 데이터 규모

필요하면 이후 SheetJS 등의 라이브러리를 검토해 XLSX를 추가한다.

---

# 15. 파일 관리

경로:

```text
/admin/media
```

## 관리 대상

- Hero 사진
- Gallery 사진
- OG 공유 이미지
- BGM
- 기타 decorative asset

## 화면 예

```text
Hero
──────────────────
[ 현재 사진 미리보기 ]
hero-main.webp
1.2 MB
1920 × 2400

[교체] [삭제]

Gallery
──────────────────
01 [사진] [교체]
02 [사진] [교체]
03 [사진] [교체]
...
```

---

# 16. R2 파일 업로드 설계

Admin 브라우저에서 파일 선택:

```text
Admin Browser
    ↓
POST /api/admin/media/upload
    ↓
Pages Function
    ↓
authorization / MIME / size validation
    ↓
R2
```

허용 타입:

- image/jpeg
- image/webp
- image/avif
- audio/mpeg

SVG는 초기에는 업로드 금지를 권장한다.

## 파일 크기 제한

예시:

- Hero: 5MB 이하
- Gallery: 개별 5MB 이하
- OG: 3MB 이하
- BGM: 15MB 이하

실제 웹 전달용은 이것보다 더 작게 최적화하는 것을 권장한다.

---

# 17. 이미지 자동 최적화

첫 버전은 안전성을 위해 관리자 업로드 전에 웹용 이미지로 변환하는 흐름을 기본으로 한다.

추후 개선:

- Cloudflare Images 사용 검토
- Worker 기반 resize pipeline
- 원본 R2 저장 + optimized variant 생성

단, 청첩장 규모에서는 복잡한 이미지 처리 인프라를 먼저 만들 필요는 없다.

Admin 업로드 화면에서 다음 경고를 제공한다.

```text
권장: WebP / 2000px 이하 / 2MB 이하
```

---

# 18. Media Metadata

R2는 binary file을 저장하고, 화면 표시 순서나 crop 설정은 D1에 저장한다.

```sql
CREATE TABLE media_assets (
    id TEXT PRIMARY KEY,
    slot TEXT NOT NULL,
    object_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    object_position TEXT,
    alt_text TEXT,
    sort_order INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT
);
```

`slot` 예:

```text
HERO
GALLERY
OG
BGM
```

---

# 19. 사진 순서 변경

Gallery 관리자 화면에서 drag & drop 또는 위/아래 버튼을 지원한다.

모바일 관리자에서도 사용 가능하도록 drag만 제공하지 않는다.

```text
↑
↓
```

버튼을 함께 제공한다.

변경 시 `sort_order`만 업데이트한다.

---

# 20. 사진 Crop / Focal Point 관리

실제 사진에서 얼굴을 중심으로 crop할 수 있게 한다.

Admin에서 사진 선택 후:

```text
가로 위치  [-----●----]
세로 위치  [---●------]
```

또는 사진 위 클릭으로 focal point 지정.

D1:

```text
object_position = "53% 32%"
```

Frontend:

```css
object-position: 53% 32%;
```

이 기능으로 iPhone/Galaxy 화면 비율이 달라도 얼굴이 잘리는 문제를 줄인다.

---

# 21. 공개 사이트 설정 관리

경로:

```text
/admin/settings
```

관리자가 GitHub 코드를 수정하지 않고 일부 기능을 제어할 수 있게 한다.

예:

```text
RSVP                ON / OFF
Guestbook           ON / OFF
Account             ON / OFF
BGM                 ON / OFF
Contact             ON / OFF
D-Day               ON / OFF
```

추가 설정:

- RSVP 마감일
- Guestbook 공개 여부
- BGM 기본 파일
- Hero media id
- OG media id
- Gallery 순서

---

# 22. site_settings 구조

단순한 key-value 형태로 시작할 수 있다.

```sql
CREATE TABLE site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL
);
```

예:

```text
rsvp_enabled = true
guestbook_enabled = true
music_enabled = true
rsvp_deadline = 2026-10-29T23:59:59+09:00
```

복잡해지면 JSON 값을 사용할 수 있다.

---

# 23. 공개 페이지 안정성 — Static Fallback

Admin/D1/R2 기능 때문에 공개 청첩장의 핵심 정보가 API 장애에 의존해서는 안 된다.

따라서 다음 정보는 기본적으로 `wedding.ts`에 fallback을 유지한다.

- 이름
- 초대 문구
- 날짜
- 장소
- 교통 안내

동적 설정 API가 실패해도 기본 청첩장은 읽을 수 있어야 한다.

```text
Static wedding.ts
       +
Remote site config
```

동적 기능만 graceful degradation 한다.

예:

- Guestbook API 장애 → 방명록 섹션 임시 숨김/오류 안내
- RSVP API 장애 → 재시도 안내
- Map SDK 장애 → 주소/외부 지도 링크 사용
- R2 media 장애 → fallback image

---

# 24. 관리자 Activity / Audit Log

관리자가 데이터를 변경하면 기록한다.

```sql
CREATE TABLE admin_audit_log (
    id TEXT PRIMARY KEY,
    actor TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    summary TEXT,
    created_at TEXT NOT NULL
);
```

예:

```text
2026-10-20 18:32
robin@example.com
RSVP_UPDATE
홍길동 참석 인원 1 → 2
```

기록 대상:

- RSVP 수정/삭제/복원
- Guestbook 숨김/삭제/복원
- site setting 변경
- 파일 업로드/교체/삭제
- CSV export

민감한 원문 전체를 audit log에 중복 저장하지 않는다.

---

# 25. 관리자 Dashboard — 최근 활동

Dashboard 하단:

```text
최근 활동
────────────────────────────
18:32 홍길동 RSVP 수정
18:24 gallery-03.webp 교체
17:48 방명록 1건 숨김
16:02 RSVP CSV 다운로드
```

운영 중 무엇을 수정했는지 쉽게 확인한다.

---

# 26. Backup / Recovery

별도 DB 서버를 운영하지 않아도 백업 전략은 필요하다.

## D1

D1 Time Travel을 이용한다.

현재 D1은 point-in-time recovery 기능을 제공하며, Free plan에서는 보존 기간이 현재 7일이다.

운영 원칙:

- schema migration 직전 bookmark/상태 확인
- 대량 수정 전 CSV export
- 실수 삭제 시 Time Travel 복구 검토

## 별도 논리 백업

관리자에서 수동 데이터 export 제공:

```text
[ 전체 데이터 백업 ]
```

결과:

```text
backup-20261020.zip
├─ rsvp.csv
├─ guestbook.csv
├─ media.csv
└─ settings.json
```

초기 구현은 zip 대신 각각 다운로드하는 방식도 허용한다.

---

# 27. Media Backup

R2 object는 GitHub 소스와 별개이므로 중요한 최종 사진은 로컬 원본도 별도로 보관한다.

권장:

```text
PC / NAS / Cloud Drive
          +
         R2
```

R2는 서비스용 저장소이지 웨딩 원본 사진의 유일한 백업으로 사용하지 않는다.

---

# 28. 관리자 System Status

경로:

```text
/admin/system
```

표시:

```text
Frontend Build    OK
API               OK
D1                OK
R2                OK
Turnstile         configured
Kakao JS Key      configured
BGM               configured
OG Image          configured
```

보안상 secret 값 자체는 표시하지 않는다.

예:

```text
Kakao Key: configured
```

만 표시한다.

---

# 29. 운영 전 Checklist

관리자 dashboard에 별도 readiness card를 둔다.

```text
결혼식 사이트 준비 상태

✓ Hero 사진
✓ Gallery 8장
✓ OG 이미지
✓ 위치 링크
✓ 연락처
✓ 계좌
✓ RSVP
✓ Guestbook
✕ BGM
✓ Kakao Share
```

최종 오픈 전에 누락을 쉽게 확인한다.

---

# 30. RSVP 마감 관리

관리자에서 RSVP 마감일 설정.

예:

```text
2026-10-29 23:59
```

마감 이후에는 폼 대신:

```text
참석 여부 전달이 마감되었습니다.
변경이 필요하시면 신랑 또는 신부에게 연락해 주세요.
```

를 표시한다.

관리자가 언제든 다시 열 수 있다.

---

# 31. Guestbook 운영 제어

관리자 설정:

- 신규 등록 허용 ON/OFF
- Guestbook 전체 표시 ON/OFF
- 메시지 최대 길이

결혼식 이후 신규 등록은 닫고 기존 글만 보존하는 것도 가능하게 한다.

---

# 32. Account / Contact 관리 범위

전화번호와 계좌 정보는 공개 정보이므로 관리 UI에서 수정 기능을 넣을 수 있지만, 초기 버전에서는 코드/config 기반으로 관리하는 것을 권장한다.

이유:

- 자주 바뀌지 않음
- 중요한 공개 개인정보
- 잘못 수정했을 때 영향이 큼

향후 필요하면 `site_settings` 또는 별도 테이블로 옮긴다.

---

# 33. Admin API 설계

예정 endpoint:

```text
GET    /api/admin/dashboard

GET    /api/admin/rsvp
GET    /api/admin/rsvp/:id
PATCH  /api/admin/rsvp/:id
DELETE /api/admin/rsvp/:id
POST   /api/admin/rsvp/:id/restore
GET    /api/admin/rsvp/export

GET    /api/admin/guestbook
PATCH  /api/admin/guestbook/:id
DELETE /api/admin/guestbook/:id
POST   /api/admin/guestbook/:id/restore
GET    /api/admin/guestbook/export

GET    /api/admin/media
POST   /api/admin/media
PATCH  /api/admin/media/:id
DELETE /api/admin/media/:id

GET    /api/admin/settings
PATCH  /api/admin/settings

GET    /api/admin/audit
GET    /api/admin/system/status
```

Public API와 Admin API를 명확히 분리한다.

---

# 34. Public API

```text
GET  /api/site-config
POST /api/rsvp
GET  /api/guestbook
POST /api/guestbook
POST /api/guestbook/:id/delete
```

Admin endpoint와 섞지 않는다.

---

# 35. 관리자 권한 검증

Cloudflare Access로 UI URL만 막고 끝내면 안 된다.

`/api/admin/*` API도 Access 보호 및 서버 측 사용자 검증을 적용한다.

브라우저에서 admin React route를 숨기는 것은 보안이 아니다.

반드시 서버 API 자체에서 권한을 검증한다.

---

# 36. CSRF / Mutation 보호

Admin mutation은 다음을 기본으로 한다.

- POST/PATCH/DELETE만 mutation
- same-origin
- Access authentication
- Origin/Host 검증
- JSON content-type 검증
- 중요한 destructive action은 confirmation

예:

```text
'홍길동 RSVP를 삭제하시겠습니까?'
```

대량 삭제 기능은 초기에는 넣지 않는다.

---

# 37. Public Spam / Abuse 보호

RSVP:

- server validation
- 최대 길이
- guest_count 범위
- Turnstile 적용 검토

Guestbook:

- Turnstile 필수 권장
- 메시지 길이 제한
- HTML 금지
- plain text 렌더링
- script injection 방지
- 과도한 반복 요청 방지

관리자 API에는 Turnstile보다 Access 인증을 사용한다.

---

# 38. 데이터 Validation

예:

```text
name          1~30자
side          GROOM | BRIDE
attendance    YES | NO
guest_count   1~20
meal          YES | NO | UNKNOWN
message       최대 500자
```

Client validation은 UX용이고 서버 validation이 최종 기준이다.

---

# 39. Admin UI 디자인

공개 청첩장과 목적이 다르므로 관리자 화면은 화보형 디자인을 그대로 복사하지 않는다.

방향:

- clean admin console
- white / charcoal
- 작은 neutral accent
- 높은 정보 밀도
- 명확한 table
- mobile responsive

공개 청첩장의 serif typography는 admin heading 정도에만 선택적으로 사용한다.

본문과 표는 sans-serif 중심.

---

# 40. Admin Desktop Layout

```text
┌─────────────────────────────────────────┐
│ Wedding Admin                  승표 ▾   │
├──────────┬──────────────────────────────┤
│ Dashboard│                              │
│ RSVP     │          Content             │
│ Guestbook│                              │
│ Media    │                              │
│ Settings │                              │
│ System   │                              │
└──────────┴──────────────────────────────┘
```

Desktop에서는 sidebar.

---

# 41. Admin Mobile Layout

휴대폰에서도 결혼식 준비 중 바로 확인할 수 있어야 한다.

```text
┌──────────────────────┐
│ Wedding Admin    ☰   │
├──────────────────────┤
│ KPI cards            │
│                      │
│ RSVP list cards      │
│                      │
└──────────────────────┘
```

모바일에서는 table을 억지로 가로 축소하지 않는다.

- 중요한 필드만 card list
- 상세정보는 bottom sheet
- filter는 sheet
- export 같은 덜 자주 쓰는 작업은 overflow menu

---

# 42. Admin Responsive 목표

- 320px 이상
- 360px
- 390px
- 430px
- Tablet
- Desktop 1280+

Admin은 공개 청첩장과 달리 desktop 사용도 중요하다.

---

# 43. 관리자 UX 세부

## Loading

전체 화면 spinner 대신 skeleton을 사용한다.

## Empty State

```text
아직 참석 응답이 없습니다.
청첩장 링크를 공유하면 이곳에서 응답을 확인할 수 있습니다.
```

## Error

```text
데이터를 불러오지 못했습니다.
[다시 시도]
```

## Save

설정 저장 후:

```text
변경사항을 저장했습니다.
```

공통 toast 사용.

---

# 44. Pagination

RSVP/Guestbook 규모가 작아도 처음부터 pagination 또는 cursor 기반 구조를 염두에 둔다.

초기 UI:

```text
25건씩
```

또는 `더 보기`.

API가 전체 테이블을 무제한 반환하지 않게 한다.

---

# 45. Search / Filter URL State

가능하면 관리자 필터를 URL query에 반영한다.

```text
/admin/rsvp?side=groom&attendance=yes
```

새로고침해도 필터 상태를 유지하고 링크 공유/북마크가 가능하다.

---

# 46. 데이터 새로고침

실시간 websocket은 사용하지 않는다.

Admin dashboard에:

```text
마지막 업데이트 18:42:15
[새로고침]
```

필요하면 30~60초 polling을 선택적으로 추가한다.

기본은 사용자 제어 refresh로 충분하다.

---

# 47. 데이터 캐싱

Public `GET /api/guestbook`, `GET /api/site-config`는 edge cache를 적절히 사용할 수 있다.

Admin 데이터는 민감하고 최신성이 중요하므로 public cache를 사용하지 않는다.

응답 header를 명확히 분리한다.

---

# 48. 파일 Cache Busting

같은 R2 object key를 덮어써 CDN cache가 남지 않도록 파일명에 version/hash를 넣는다.

예:

```text
hero/hero-main-20261020-183200.webp
```

DB의 media pointer를 새 object로 변경한 뒤 이전 object를 정리한다.

---

# 49. 파일 삭제 정책

사진 교체 시 기존 파일을 즉시 지우지 않고 짧은 보관기간을 둘 수 있다.

예:

```text
active = 0
```

으로 metadata 비활성화 후 실제 R2 delete는 관리자가 명시적으로 수행.

첫 버전에서는 교체 직전 object key를 audit log에 남긴다.

---

# 50. 운영 통계 추가 후보

개인정보를 과하게 수집하지 않는 선에서 다음 통계만 고려한다.

- RSVP 응답 추이
- 신랑/신부 측 비율
- 참석 예상 인원
- 식사 예상 인원
- 방명록 등록 수

사이트 방문자 추적/광고 분석은 핵심 요구가 아니므로 기본으로 넣지 않는다.

추후 필요하면 개인정보 침해를 최소화하는 analytics를 별도 검토한다.

---

# 51. 관리자 알림

초기 버전에서는 이메일/Slack 알림 없이 관리자 dashboard에서 확인한다.

추후 선택 기능:

- RSVP 신규 등록 이메일 알림
- RSVP 일일 요약
- Guestbook 신규 글 알림

알림이 너무 많아질 수 있으므로 default OFF.

---

# 52. 운영 Lifecycle

## 청첩장 공개 전

Admin:

- 콘텐츠 점검
- 사진 업로드
- 계좌/연락처 점검
- RSVP 테스트
- Guestbook 테스트
- 테스트 데이터 삭제

## 공개 기간

- RSVP 확인
- 방명록 관리
- 통계 확인
- CSV export

## 예식 직전

- RSVP 마감
- 최종 CSV export
- 참석 인원/식사 인원 확정
- 전체 데이터 백업

## 예식 이후

선택:

- RSVP form OFF
- Guestbook 신규 등록 OFF
- 기존 청첩장 read-only 유지
- 일정 기간 후 D1 개인정보 삭제

---

# 53. 개인정보 보존 정책

RSVP 이름/참석정보는 결혼식 운영 목적의 데이터다.

결혼식 이후 필요 이상 장기간 보존하지 않는 것을 권장한다.

예:

```text
결혼식 + 30~90일 후 RSVP 삭제
```

실제 삭제 시점은 운영자가 결정한다.

Guestbook은 추억으로 유지할 수 있으므로 RSVP와 보존 정책을 분리한다.

---

# 54. 관리자 Data Cleanup

Admin System에 향후 다음 기능 후보를 둔다.

```text
[ RSVP 데이터 전체 삭제 ]
[ Guestbook 데이터 전체 삭제 ]
[ 테스트 데이터 삭제 ]
```

위 기능은 매우 위험하므로 초기 버전에서는 구현하지 않거나 multi-step confirmation을 요구한다.

대신 D1 Dashboard/CLI 관리로 제한하는 것도 가능하다.

---

# 55. Environment 분리

최소 두 환경을 사용한다.

```text
Preview
Production
```

가능하면 D1도 분리한다.

```text
wedding-db-preview
wedding-db-production
```

R2도 prefix 또는 bucket으로 분리.

테스트 RSVP가 실제 참석자 데이터에 섞이지 않게 하는 것이 중요하다.

---

# 56. Local Development

Wrangler를 사용해 로컬 D1/Functions 환경을 실행한다.

목표:

```text
Local React
Local Pages Functions
Local D1
```

실제 production D1에 연결하지 않고 개발할 수 있게 한다.

파일 업로드는 개발 초기에는 local/mock storage 또는 preview R2 binding 사용을 검토한다.

---

# 57. Repository 구조 확장

예정:

```text
wed_mobile/
├─ src/
│  ├─ invitation/
│  ├─ admin/
│  │  ├─ pages/
│  │  │  ├─ DashboardPage.tsx
│  │  │  ├─ RsvpPage.tsx
│  │  │  ├─ GuestbookPage.tsx
│  │  │  ├─ MediaPage.tsx
│  │  │  ├─ SettingsPage.tsx
│  │  │  └─ SystemPage.tsx
│  │  ├─ components/
│  │  └─ api/
│  └─ shared/
│
├─ functions/
│  └─ api/
│     ├─ public/
│     └─ admin/
│
├─ database/
│  ├─ schema.sql
│  └─ migrations/
│
├─ docs/
│  ├─ DEVELOPMENT_PLAN.md
│  └─ ADMIN_CONSOLE_PLAN.md
│
└─ ...
```

실제 Vite routing 구조에 맞춰 경로는 구현 단계에서 조정한다.

---

# 58. Admin 기능 Phase

## Admin Phase A — Backend Foundation

- [ ] D1 생성
- [ ] local/preview/production 분리
- [ ] schema/migration 구성
- [ ] R2 bucket 생성
- [ ] Pages bindings
- [ ] public/admin API route 분리

## Admin Phase B — Authentication

- [ ] Cloudflare Access 설정
- [ ] `/admin*` 보호
- [ ] `/api/admin/*` 보호
- [ ] 허용 관리자 이메일 등록
- [ ] unauthorized 테스트

## Admin Phase C — Dashboard / RSVP

- [ ] Dashboard KPI
- [ ] RSVP table/card
- [ ] 검색
- [ ] 필터
- [ ] 수정
- [ ] soft delete
- [ ] restore
- [ ] CSV export

## Admin Phase D — Guestbook

- [ ] Guestbook 목록
- [ ] 검색
- [ ] hide/show
- [ ] soft delete
- [ ] restore
- [ ] CSV export

## Admin Phase E — Media

- [ ] R2 upload
- [ ] preview
- [ ] replace
- [ ] Gallery reorder
- [ ] object-position 설정
- [ ] OG 관리
- [ ] BGM 관리

## Admin Phase F — Settings / Operations

- [ ] Feature toggle
- [ ] RSVP deadline
- [ ] Guestbook registration toggle
- [ ] readiness checklist
- [ ] system status
- [ ] audit log

## Admin Phase G — Backup / QA

- [ ] D1 recovery 절차 문서화
- [ ] CSV backup
- [ ] Preview DB 테스트
- [ ] production destructive action 테스트
- [ ] mobile admin 테스트
- [ ] Access bypass 테스트

---

# 59. 관리자 Definition of Done

관리자 기능은 다음을 만족해야 완료로 본다.

## 인증

- [ ] 로그인하지 않은 사용자는 `/admin` 접근 불가
- [ ] 로그인하지 않은 사용자는 Admin API 호출 불가
- [ ] 관리자 secret/password가 frontend bundle에 없음

## RSVP

- [ ] 통계 정확
- [ ] 검색/필터 가능
- [ ] 수정 가능
- [ ] soft delete/restore 가능
- [ ] CSV export 가능

## Guestbook

- [ ] 조회 가능
- [ ] 숨김/해제 가능
- [ ] 삭제/복원 가능
- [ ] 공개 사이트에 상태 즉시 반영

## Media

- [ ] R2 업로드 가능
- [ ] 파일 validation
- [ ] Hero/Gallery 교체
- [ ] Gallery 순서 변경
- [ ] focal point 관리
- [ ] BGM 교체
- [ ] OG 교체

## Operations

- [ ] feature toggle
- [ ] RSVP 마감
- [ ] system status
- [ ] audit log
- [ ] backup/export
- [ ] Preview/Production 데이터 분리

## UX

- [ ] PC에서 편리
- [ ] 모바일에서도 핵심 작업 가능
- [ ] destructive action 오작동 방지
- [ ] loading/error/empty state 존재

---

# 60. 최종 운영 구조 한 문장

> **공개 청첩장은 Cloudflare Pages에서 빠르게 제공하고, 참석/방명록/설정은 D1, 사진·OG·BGM은 R2에 저장하며, Cloudflare Access로 보호된 `/admin`에서 통계·데이터·파일·운영 설정을 모두 관리하는 서버리스 웨딩 운영 콘솔을 구축한다.**

이 구조를 관리자 기능 구현의 기준으로 사용한다.
