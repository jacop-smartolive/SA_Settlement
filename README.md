# SA_Settlement v1.1

> Olive Ticket Service Admin — **정산 관리** 모듈
> 브랜치 `v1.1` · 포트 **8081**

## 🚀 빠른 시작

```bash
cd SA_Settlement_v1_1
npm install
npm run dev
# → http://localhost:8081/src/index.html
```

### 환경변수 (`.env`)
```bash
SMTP_USER=rpa@smart-olive.co.kr
SMTP_PASS=<Gmail 앱 비밀번호>
PORT=8081
CONFIRM_SECRET=<HMAC 시크릿 64자 hex>
# 선택:
# CONFIRMATIONS_PATH=/path/to/confirmations.json
```

> 📁 `.env`는 `.gitignore`에 포함되므로 새 환경에선 직접 생성 필요.
> HMAC 시크릿 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📋 무엇이 동작하나?

| 화면 | 경로 | 기능 |
|---|---|---|
| **정산 완료 내역 목록** | `/src/index.html` | 30개 회사 검색·페이징·최근 진행내역 |
| **정산 기간별 조회 상세** | `/src/pages/settlement-detail.html?company=&count=` | 21열 표·정산서 워크플로우·메일 발송·5종 다운로드 |
| **메일 확정 페이지** | `/api/confirm-settlement?c=&r=&t=` | 수신자가 메일 링크 클릭 시 도착 |

### 핵심 사용 시나리오

```
1. 목록에서 회사 클릭
2. 정산상세 [원본 ▾] → 원본 다운로드 / 수정본 첨부 / 미리보기 / 정산서 확정
3. [발송 ▾] → 메일 발송 (정산서 확정 버튼 자동 삽입)
4. 수신자가 메일 [정산서 확정 처리] 클릭
5. 관리자 화면 10초 내 자동 [완료] 반영
```

---

## 📦 외부 의존성

### npm (`package.json`)
- `express` — 정적 서버 + API
- `nodemailer` — Gmail SMTP 발송
- `imapflow` + `mailparser` — Gmail IMAP 회신 검색
- `multer` — 파일 업로드 (수정본/첨부)
- `dotenv` — `.env` 로드

### CDN (브라우저)
- **SheetJS** (`xlsx-0.20.0`) — Excel 파일 파싱
- **JSZip** (`3.10.1`) — 일괄등록 ZIP 생성
- **Google Fonts** Nanum Gothic

---

## 📚 문서 (`docs/`)

| 파일 | 내용 |
|---|---|
| [`v1.1-LOGIC.md`](./docs/v1.1-LOGIC.md) | **⭐ 전체 로직 명세서 (필독)** — 페이지/API/데이터 흐름 |
| [`01_directory-structure.md`](./docs/01_directory-structure.md) | 폴더 구조 설계 |
| [`02_process-analysis.md`](./docs/02_process-analysis.md) | 업무 프로세스 분석 |
| [`03_navigation-flow.md`](./docs/03_navigation-flow.md) | LNB·GNB·페이지 이동 |
| [`CHANGELOG.md`](./docs/CHANGELOG.md) | 작업 이력 (세션 단위) |

---

## 🗂 디렉토리 구조

```
SA_Settlement_v1_1/
├─ server.js               # Express 서버 (8개 API 엔드포인트)
├─ package.json
├─ .env                    # SMTP/HMAC (gitignore)
├─ confirmations.json      # 정산서 확정 영속 (gitignore, 자동 생성)
├─ revisions/              # 수정본 업로드 저장소 (gitignore)
├─ resources/
│  └─ samples/
│     └─ 디와이피엔에프(주)_2026-04-30_정산서.xlsx  # 공통 원본 Excel
├─ src/
│  ├─ index.html           # 목록 페이지
│  ├─ pages/
│  │  └─ settlement-detail.html  # 상세 페이지
│  └─ assets/
│     ├─ css/mail-send-modal.css
│     └─ js/
│        ├─ mail-send-modal.js   # 메일 발송 모달
│        └─ bulk-registration.js # 일괄등록
└─ docs/
   ├─ v1.1-LOGIC.md        # 메인 명세서
   └─ ...
```

---

## 🔑 API 요약

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/api/send-email` | 메일 발송 + 정산서 확정 버튼 자동 삽입 |
| `POST` | `/api/gmail-search` | IMAP 회신 메일 검색 |
| `POST` | `/api/gmail-detail` | 메일 상세 + 첨부 |
| `POST` | `/api/upload-revision` | 수정본 파일 업로드 |
| `DELETE` | `/api/upload-revision` | 수정본 파일 삭제 |
| `GET` | `/api/revision-file` | 수정본 파일 다운로드 (메일 첨부용) |
| `GET` | `/api/confirm-settlement` | 메일 링크 클릭 → 확정 처리 (HMAC 검증) |
| `GET` | `/api/settlement-confirmations` | 회사별 확정 목록 (폴링용) |

---

## 🛡 보안

- ✅ HMAC-SHA256 토큰 검증 (정산서 확정 링크)
- ✅ Timing-safe 비교 (`crypto.timingSafeEqual`)
- ✅ SMTP/HMAC 시크릿 `.env` 분리 (gitignore)
- ⚠ 운영 환경 추가 권장: CSRF, Rate limiting, HTTPS

---

## 🎨 컬러 시스템 (B안)

| 컬러 | hex | 시맨틱 |
|---|---|---|
| 🔴 브랜드 레드 | `#ed1b24` | 로고/메뉴 |
| 🟢 완료/확정 | `#059669` | 정산서 확정 상태 |
| 🟣 수정본 (인디고) | `#4f46e5` | 수정본 첨부 상태 |
| 🟡 업로드/대기 (앰버) | `#d97706` | 업로드 액션 |
| 🔘 원본/그레이 | `#4b5563` | 원본 다운로드 |
| 🔵 홈택스 | `#1a6cf6` | 세금계산서 팝업 (예약) |
| 🩷 LG U+ | `#e5006a` | 세금계산서 팝업 (예약) |

자세한 매핑은 `docs/v1.1-LOGIC.md` §11 참고.

---

## 📌 v2.0 대비 차이

| 항목 | v2.0 | v1.1 |
|---|---|---|
| 포트 | 8080 | 8081 |
| 페이지 | 정산상세 4종 (회사별) | 정산기간별 조회 (URL 파라미터) |
| 수정본 컬러 | 블루 `#2563eb` | **인디고 `#4f46e5`** |
| 모든 회사 데이터 | 회사별 다른 데이터 | **디와이피엔에프 Excel 통일** |
| 메일 확정 버튼 | 없음 | **본문 자동 삽입 + HMAC** |
| 확정 자동 동기화 | 없음 | **10초 폴링 + visibilitychange 절전** |

---

## 🧪 테스트

```bash
# 1. 서버 실행
npm run dev

# 2. 브라우저에서 목록 접속
open http://localhost:8081/src/index.html

# 3. 회사 클릭 → 상세 진입
# 4. 정산서 [원본 ▾] → 다양한 액션 테스트
# 5. [발송 ▾] → 메일 발송 → 수신함에서 확정 버튼 클릭
# 6. 관리자 화면 10초 내 [완료] 반영 확인
```

---

## 📝 작업 규칙

- 모든 구조 변경은 `docs/v1.1-LOGIC.md` 갱신과 동반
- 폴더별 README는 부수적, **메인 문서는 `docs/v1.1-LOGIC.md`**
- 커밋 메시지: 한국어 권장, 영문 무방
- 파일 이동: `git mv` 사용 (히스토리 유지)
