# 01. 디렉토리 구조 설계서

> v1.1 현 상태 — 구현된 2개 화면 (업체 정산 완료 내역 + 정산상세) 중심

## 1. 최상위 트리

```
SA_Settlement_v1_1/
├─ server.js                  # ⭐ Express 백엔드 (8개 API)
├─ package.json               # 의존성
├─ .env                       # SMTP/HMAC 자격증명 (.gitignore)
├─ .gitignore                 # node_modules, .env, confirmations.json, revisions/
│
├─ confirmations.json         # ✱ 정산서 확정 영속 저장 (자동 생성, gitignore)
├─ revisions/                 # ✱ 수정본 업로드 폴더 (자동 생성, gitignore)
│
├─ resources/samples/
│  └─ 디와이피엔에프(주)_2026-04-30_정산서.xlsx  # ⭐ 공통 원본 Excel
│
├─ src/
│  ├─ index.html              # ⭐ ① 업체 정산 완료 내역 (목록)
│  ├─ pages/
│  │  └─ settlement-detail.html  # ⭐ ② 정산상세 (정산 기간별 조회)
│  └─ assets/
│     ├─ css/mail-send-modal.css
│     └─ js/
│        ├─ mail-send-modal.js
│        └─ bulk-registration.js
│
└─ docs/
   ├─ README.md               # 문서 허브
   ├─ v1.1-LOGIC.md           # ⭐ 메인 로직 명세
   ├─ 01_directory-structure.md
   ├─ 02_process-analysis.md
   ├─ 03_navigation-flow.md
   └─ CHANGELOG.md
```

## 2. 핵심 파일 책임

| 파일 | 책임 |
|---|---|
| `server.js` | Express 서버, 정적 파일 서빙, 8개 API 엔드포인트 |
| `src/index.html` | ① 목록 페이지 (검색·페이징·최근 진행내역) |
| `src/pages/settlement-detail.html` | ② 정산상세 페이지 (21열 표·워크플로우·메일 발송) |
| `src/assets/js/mail-send-modal.js` | 메일 발송 모달 (v2.0 이식) |
| `resources/samples/디와이피엔에프(주)_2026-04-30_정산서.xlsx` | 모든 회사 공통 원본 Excel |
| `.env` | SMTP_USER, SMTP_PASS, PORT, CONFIRM_SECRET |
| `confirmations.json` | 정산서 확정 영속 저장 |
| `revisions/` | 사용자 업로드 수정본 (`{기업명}_{rowNo}.xlsx`) |

## 3. 자동 생성 파일/폴더

| 경로 | 생성 시점 | 용도 |
|---|---|---|
| `confirmations.json` | 첫 확정 발생 시 | 정산서 확정 기록 영속 |
| `revisions/` | 서버 시작 시 | 수정본 파일 저장 디렉토리 |
| `revisions/{기업명}_{rowNo}.xlsx` | 수정본 업로드 시 | 사용자 첨부 파일 |

## 4. localStorage 키

브라우저에 회사별로 저장되는 3개 키:

| 키 | 저장 데이터 |
|---|---|
| `v11-detail-settle-{기업명}` | 정산서 상태 (hasRevision, revData, lastAction, doneSettlement) |
| `v11-mail-{기업명}` | 메일 발송 이력 (mail_sent, mail_history) |
| `v11-dl-{기업명}` | 5개 다운로드 컬럼 이력 (reverse/forward/forwardSimple/transfer/slip) |

> 상세 스키마: [`v1.1-LOGIC.md`](./v1.1-LOGIC.md) §4

## 5. 경로 계산 규칙

### HTML 파일 위치별 상대경로

```
/src/index.html (목록 페이지)
└─ → 상세 페이지: 'pages/settlement-detail.html'

/src/pages/settlement-detail.html (정산상세)
├─ → 메인 페이지: '../index.html'
├─ → 공통 JS: '../assets/js/mail-send-modal.js'
├─ → 공통 CSS: '../assets/css/mail-send-modal.css'
└─ → Excel 파일: '../../resources/samples/디와이피엔에프(주)_2026-04-30_정산서.xlsx'
```

### 서버 API 호출 (절대 경로)

```
POST   /api/send-email
POST   /api/upload-revision
DELETE /api/upload-revision
GET    /api/revision-file?c=&r=
GET    /api/confirm-settlement?c=&r=&t=
GET    /api/settlement-confirmations?company=
```

## 6. 파일 명명 규칙

| 종류 | 패턴 | 예시 |
|---|---|---|
| 메인 페이지 | `index.html`, `settlement-detail.html` | (단일 파일 — URL 파라미터로 회사 구분) |
| 수정본 업로드 | `{기업명}_{rowNo}.xlsx` | `revisions/디와이피엔에프(주)_77.xlsx` |
| 다운로드 파일 | `{기업명}_정산서_{YYYYMMDD}.xlsx` | `(주)조선뉴스프레스_정산서_20260511.xlsx` |
| 문서 | `NN_{kebab-slug}.md` | `01_directory-structure.md` |

## 7. 참조

- 업무 흐름: [`02_process-analysis.md`](./02_process-analysis.md)
- 화면 이동: [`03_navigation-flow.md`](./03_navigation-flow.md)
- 코드 명세: [`v1.1-LOGIC.md`](./v1.1-LOGIC.md)
