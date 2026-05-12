# 01. 디렉토리 구조 설계서

> v1.1 기준 (2026-05-11) — 현재 코드 상태 반영

## 1. 목적
- v1.1 프런트엔드 소스·서버·리소스·문서를 역할별로 분리
- 폴더 책임 명확화 + 신규 작업자가 빠르게 위치 파악

## 2. 최상위 트리

```
SA_Settlement_v1_1/
├─ server.js                  # ⭐ Express 백엔드 (단일 파일, 모든 API)
├─ package.json               # 의존성: express, nodemailer, imapflow, multer, dotenv
├─ .env                       # SMTP/HMAC 자격증명 (.gitignore)
├─ .gitignore                 # node_modules, .env, confirmations.json, revisions/
│
├─ confirmations.json         # ✱ 정산서 확정 영속 저장 (자동 생성, gitignore)
├─ revisions/                 # ✱ 수정본 업로드 파일 (자동 생성, gitignore)
│
├─ resources/                 # 정적 리소스 (코드 fetch 대상)
│  └─ samples/
│     └─ 디와이피엔에프(주)_2026-04-30_정산서.xlsx  # ⭐ 공통 원본 Excel
│
├─ src/                       # 프런트엔드 (브라우저)
│  ├─ index.html              # 진입점 — 정산 완료 내역 목록
│  ├─ pages/
│  │  └─ settlement-detail.html  # 정산 기간별 조회 상세
│  └─ assets/
│     ├─ css/mail-send-modal.css
│     ├─ js/
│     │  ├─ mail-send-modal.js     # v2.0에서 이식
│     │  └─ bulk-registration.js
│     └─ data/store_master.json    # 참조 데이터
│
└─ docs/                      # 설계 문서
   ├─ README.md               # 문서 허브
   ├─ v1.1-LOGIC.md           # ⭐ 메인 로직 명세
   ├─ 01_directory-structure.md  # (이 파일)
   ├─ 02_process-analysis.md
   ├─ 03_navigation-flow.md
   └─ CHANGELOG.md
```

## 3. 폴더별 책임

| 경로 | 책임 | 비고 |
|---|---|---|
| `/server.js` | 8개 API 엔드포인트, 정적 파일 서빙 | 단일 파일로 유지 (분리 시 import 경로 영향) |
| `/.env` | SMTP_USER, SMTP_PASS, PORT, CONFIRM_SECRET | 절대 커밋 X |
| `/resources/samples/` | 다운로드/메일 첨부용 원본 Excel | 핵심: `디와이피엔에프(주)_2026-04-30_정산서.xlsx` |
| `/revisions/` | 사용자 업로드 수정본 (서버 측 영속) | 파일명 패턴: `{기업명}_{rowNo}.xlsx` |
| `/confirmations.json` | 정산서 확정 기록 | 메일 링크 클릭 시 누적 |
| `/src/index.html` | 정산 완료 내역 목록 | localStorage 3종 키 읽기 |
| `/src/pages/settlement-detail.html` | 상세 페이지 (21열 표) | URL 파라미터 `?company=&count=` |
| `/src/assets/js/mail-send-modal.js` | 메일 발송 UI (수신자/제목/본문/첨부) | v2.0 동일, 외부 의존성 없음 |
| `/src/assets/js/bulk-registration.js` | 일괄등록 모듈 | (보조) |
| `/docs/` | 설계 문서 + CHANGELOG | 메인은 `v1.1-LOGIC.md` |

## 4. localStorage 키 (브라우저)

| 키 | 저장 데이터 | 사용처 |
|---|---|---|
| `v11-detail-settle-{기업명}` | 정산서 상태 (hasRevision, revData, lastAction, doneSettlement) | 상세 페이지 |
| `v11-mail-{기업명}` | 메일 발송 이력 | 상세 페이지 + 목록 진행내역 |
| `v11-dl-{기업명}` | 5개 다운로드 컬럼 이력 | 상세 페이지 + 목록 진행내역 |

> 자세한 스키마는 `v1.1-LOGIC.md` §5

## 5. 파일 명명 규칙

| 종류 | 패턴 | 예시 |
|---|---|---|
| 상세 페이지 | `settlement-detail.html` | (URL 파라미터로 회사 구분) |
| 수정본 업로드 | `{기업명}_{rowNo}.xlsx` | `revisions/디와이피엔에프(주)_77.xlsx` |
| 다운로드 파일 | `{기업명}_정산서_{YYYYMMDD}.xlsx` | `(주)조선뉴스프레스_정산서_20260511.xlsx` |
| 문서 | `NN_{kebab-slug}.md` | `01_directory-structure.md` |

## 6. 경로 계산 규칙

### HTML 파일 위치별 상대경로

```
/src/index.html (목록)
├─ → 상세: 'pages/settlement-detail.html'
├─ → CSS: (인라인)
└─ → Excel 파일: (직접 fetch 안 함)

/src/pages/settlement-detail.html
├─ → 메인 페이지: '../index.html'
├─ → 공통 JS: '../assets/js/mail-send-modal.js'
├─ → 공통 CSS: '../assets/css/mail-send-modal.css'
└─ → Excel 파일: '../../resources/samples/디와이피엔에프(주)_2026-04-30_정산서.xlsx'
```

### 서버 API 호출 (절대 경로)

```
/api/send-email
/api/upload-revision
/api/revision-file?c=&r=
/api/confirm-settlement?c=&r=&t=
/api/settlement-confirmations?company=
```

## 7. 확장 가이드라인

### 새 페이지 추가 시
1. `src/pages/{new-page}.html` 생성
2. `docs/03_navigation-flow.md`에 진입점 추가
3. `docs/v1.1-LOGIC.md` §4에 페이지 흐름 추가

### 새 API 추가 시
1. `server.js`에 핸들러 추가
2. `docs/v1.1-LOGIC.md` §6에 명세 추가
3. 필요 시 `.env`에 신규 변수 추가 (CONFIG)

### 새 localStorage 키 추가 시
1. 키 이름은 `v11-` prefix 유지
2. `docs/v1.1-LOGIC.md` §5에 스키마 정의
3. 목록 페이지의 `getCompanyActions()` 갱신

## 8. 참조

- 업무 프로세스: [`02_process-analysis.md`](./02_process-analysis.md)
- 화면 이동: [`03_navigation-flow.md`](./03_navigation-flow.md)
- 전체 로직: [`v1.1-LOGIC.md`](./v1.1-LOGIC.md)
- 작업 이력: [`CHANGELOG.md`](./CHANGELOG.md)
