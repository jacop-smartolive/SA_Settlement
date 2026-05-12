# SA_Settlement v1.1

> Olive Ticket Service Admin — **정산 관리** (v1.1)
> 포트 **8081** · 브랜치 `v1.1`

## 🚀 빠른 시작

```bash
cd SA_Settlement_v1_1
npm install
npm run dev
# → http://localhost:8081/src/index.html
```

### `.env` (필수)

```bash
SMTP_USER=rpa@smart-olive.co.kr
SMTP_PASS=<Gmail 앱 비밀번호>
PORT=8081
CONFIRM_SECRET=<HMAC 시크릿 64자 hex>
```

> `.env`는 `.gitignore`에 포함. 새 환경에선 직접 생성 필요.
> HMAC 시크릿 생성: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📋 구현된 화면

### ① 업체 정산 완료 내역 (목록)
- **경로**: `/src/index.html`
- **기능**: 30개 회사 검색·페이징·최근 진행내역 조회
- **8개 컬럼**: 번호 / 기업체 / 사업자등록번호 / 대표자명 / 이메일 / 정산 완료 건수 / 최근 진행내역 / 마지막 정산 완료일
- **클릭 가능**: 기업체·정산 완료 건수 → 상세 페이지 / 최근 진행내역 → 팝업

### ② 정산상세 (정산 기간별 조회)
- **경로**: `/src/pages/settlement-detail.html?company=&count=`
- **기능**: 50개 행 (월별 정산 내역), 21개 컬럼
- **12개 데이터 컬럼** (디와이피엔에프 Excel 통일):
  - 번호 / 정산기간 / 결제건수 / 사용포인트 / 요금단가 / 이용료(기업체) / 기업체 입금액 / 모바일쿠폰 정산 / 가맹점 매출 / 수수료 / 이체액 / 이체 제외 금액
- **9개 액션 컬럼**:
  - 정산서 (원본↔수정본↔완료) / 메일 발송 (발송↔재발송) / 가맹 역발행 / 정발행 일 / 정발행 간 / 대량이체 / 회계전표 / 삭제 / 요청일

---

## 🔑 핵심 동작

### 정산서 워크플로우
```
[원본 ▾] → 수정본 첨부 → [수정본 ▾] → 정산서 확정 → [완료 ▾]
  회색         앰버 업로드 라벨   인디고      그린
```

### 메일 발송 + 자동 확정 동기화
```
관리자 → 메일 발송 (본문에 정산서 확정 그린 버튼 자동 삽입)
   ↓
수신자 → 메일 [정산서 확정 처리] 클릭 → 서버 기록 (HMAC 검증)
   ↓
관리자 화면 → 10초 폴링 → [완료] 자동 표시
```

### 수정본 첨부
```
[수정본 첨부] → 파일 선택
  ↓
파싱 (라벨 정규식 검색) → revData 저장 → UI 갱신
  ↓
서버 업로드 (revisions/{기업명}_{rowNo}.xlsx)
  ↓
메일 발송 시 자동 첨부
```

---

## 📦 의존성

### npm (`package.json`)
- `express`, `nodemailer`, `imapflow`, `mailparser`, `multer`, `dotenv`

### CDN (브라우저)
- SheetJS (xlsx-0.20.0), JSZip (3.10.1), Google Fonts (Nanum Gothic)

---

## 🔌 서버 API (8개)

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/send-email` | 메일 발송 + 확정 버튼 자동 삽입 |
| POST | `/api/gmail-search` | IMAP 회신 검색 |
| POST | `/api/gmail-detail` | 메일 상세 |
| POST | `/api/upload-revision` | 수정본 업로드 |
| DELETE | `/api/upload-revision` | 수정본 삭제 |
| GET | `/api/revision-file` | 수정본 다운로드 |
| GET | `/api/confirm-settlement` | 메일 링크 클릭 (HMAC 검증) |
| GET | `/api/settlement-confirmations` | 확정 목록 조회 (폴링) |

---

## 🛡 보안

- ✅ HMAC-SHA256 토큰 검증 (정산서 확정 링크)
- ✅ `crypto.timingSafeEqual` (타이밍 공격 방지)
- ✅ SMTP/HMAC `.env` 분리 (gitignore)
- ⚠ 운영 환경 추가 권장: CSRF, Rate limiting, HTTPS

---

## 🎨 컬러 시스템 (B안)

| 컬러 | hex | 시맨틱 |
|---|---|---|
| 🔴 브랜드 레드 | `#ed1b24` | 로고 |
| 🟢 완료/확정 | `#059669` | 정산서 확정 |
| 🟣 수정본 (인디고) | `#4f46e5` | 수정본 상태 |
| 🟡 업로드 (앰버) | `#d97706` | 수정본 업로드 라벨 |
| 🔘 원본 (그레이) | `#4b5563` | 원본 다운로드 라벨 |

자세한 매핑은 [`docs/v1.1-LOGIC.md`](./docs/v1.1-LOGIC.md) §8.

---

## 📚 문서

| 파일 | 내용 |
|---|---|
| ⭐ [`docs/v1.1-LOGIC.md`](./docs/v1.1-LOGIC.md) | **메인 로직 명세서** (필독) |
| [`docs/01_directory-structure.md`](./docs/01_directory-structure.md) | 폴더 구조 |
| [`docs/02_process-analysis.md`](./docs/02_process-analysis.md) | 업무 프로세스 |
| [`docs/03_navigation-flow.md`](./docs/03_navigation-flow.md) | 페이지 이동 |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 작업 이력 |

---

## 🧪 검증 시나리오

```bash
# 1. 서버 시작
npm run dev

# 2. 브라우저
http://localhost:8081/src/index.html

# 3. 디와이피엔에프(주) 클릭 → 상세 진입
#    - 표의 첫 행: 4,375건 / 32,595,860원 표시 확인
#    - [원본 ▾] → 원본 미리보기 → 21개 가맹점 명세 모달

# 4. 메일 발송
#    [발송 ▾] → 메일 발송 → 수신자 입력 → 발송

# 5. 수신함에서 본문 [정산서 확정 처리] 클릭
#    → 그린 체크 카드 페이지 표시

# 6. 관리자 화면 (10초 폴링)
#    → 해당 행 [완료 ▾] 그린 자동 표시
#    → 일시 라벨 "정산서 확정"
```

---

## 📌 v2.0 대비 차이

| 항목 | v2.0 | v1.1 |
|---|---|---|
| 포트 | 8080 | **8081** |
| 페이지 수 | 기업별 상세 4종 | **정산상세 1종** (URL 파라미터) |
| 수정본 컬러 | 블루 `#2563eb` | **인디고 `#4f46e5`** |
| 모든 회사 데이터 | 회사별 다른 데이터 | **디와이피엔에프 Excel 통일** |
| 메일 확정 버튼 | 없음 | **본문 자동 삽입 + HMAC** |
| 확정 자동 동기화 | 없음 | **10초 폴링 + 절전** |
| 수정본 서버 저장 | 없음 | **revisions/ 폴더** |
