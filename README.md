# SA_Settlement

Olive Ticket Service Admin — **정산 관리** 영역 프런트엔드.

## 빠른 시작

Node 기반 정적 서버 + 메일 발송 API(Nodemailer + Gmail SMTP)를 제공한다.

```bash
cd SA_Settlement
npm install
npm run dev
# http://localhost:8080/src/index.html
```

`.env`에 SMTP 자격증명 필요 (이미 로컬에 설정됨):
```
SMTP_USER=rpa@smart-olive.co.kr
SMTP_PASS=<Gmail 앱 비밀번호>
PORT=8080
```

API: `POST /api/send-email` (FormData — `recipients` JSON, `subject`, `body`, `attachments`)

## 폴더 개요
```
SA_Settlement/
├─ docs/        # 설계 문서 (아래 참조)
├─ src/         # 프런트 소스 (진입점: src/index.html)
└─ resources/   # 엑셀 템플릿·샘플·스크린샷
```

## 설계 문서 (docs/)
1. [디렉토리구조설계서](./docs/01_directory-structure.md)
2. [프로세스분석서](./docs/02_process-analysis.md)
3. [네비게이션플로우](./docs/03_navigation-flow.md)
4. [CHANGELOG](./docs/CHANGELOG.md) — **매 세션 갱신 필수**

## 구현 상태
| 영역 | 상태 |
|---|---|
| 업체 정산 완료 내역 목록 (`src/index.html`) | 구현 |
| 한화에어로스페이스 상세 (`src/pages/detail-hanwha-aerospace.html`) | 풀 기능 (세금계산서·대량이체·회계전표) |
| 두산/한화오션/HD현대 상세 | 와이어프레임 |
| **정산하기** (`src/settlement/`) | **planned** |

## 작업 규칙
- 구조/프로세스/네비게이션 변경 시 `docs/` 3종 + `CHANGELOG.md` 동시 갱신
- 폴더별 변경은 해당 폴더 `README.md` 의 "작업 내역" 에도 기록
- 파일 이동은 `git mv` 로 히스토리 유지
