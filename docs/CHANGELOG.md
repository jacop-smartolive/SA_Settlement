# CHANGELOG

> v1.1 브랜치 작업 이력 (최신순)
> 형식: `## YYYY-MM-DD — 주제` / `### Added / Changed / Removed / Fixed / Security / Docs`

---

## 2026-05-11 — 문서 전체 갱신 + 운영 안정성 완료

### Docs
- `README.md` 루트 — v1.1 운영 가이드로 전면 재작성
- `docs/README.md` — 문서 허브 (어떤 문서를 봐야 하나? 매트릭스)
- `docs/01_directory-structure.md` — v1.1 현 상태 반영, server.js·revisions·confirmations.json 등 추가
- `docs/02_process-analysis.md` — 5단계 업무 플로우 + 워크플로우 다이어그램
- `docs/03_navigation-flow.md` — LNB/GNB/모달/외부 페이지(확정) 모두 포함
- `docs/v1.1-LOGIC.md` — 14 섹션 메인 명세서 신규

### Security
- HMAC-SHA256 토큰 검증 (정산서 확정 링크)
- `crypto.timingSafeEqual` 사용
- `.env`에 `CONFIRM_SECRET` 추가 (gitignore 분리)

### Fixed (Info)
- 라벨 정규식 매칭 (parseRevisionFile) — 합성어 오파싱 방지
- 목록 페이지 hasRevision 정확 반영
- confirmations.json 경로 ENV 지원

---

## 2026-05-11 — 모든 회사 표 → 디와이피엔에프 데이터 통일

### Changed
- `generateRow()`: 디와이피엔에프 한정 분기 제거, 모든 회사 DYPNF_APRIL_2026 사용
- `openSettlementPreview()`: `isLatestOrig` 조건으로 변경 (회사 무관)
- `downloadSettlementFile()`: 모든 회사 동일 Excel 다운로드 (파일명만 회사별)
- `fetchOriginalFile()`: 회사 조건 제거
- 코드 73줄 삭제 / 43줄 추가 (분기 제거로 단순화)

---

## 2026-05-11 — Critical/Warning/Info 점검 항목 일괄 수정

### Fixed (Critical)
- 날짜 포맷 통일: 모든 저장 위치 → YYYY-MM-DD, 표시는 toShortDate() helper
- rowNo 정수 캐스팅 (server.js, 클라이언트 폴링)
- setInterval cleanup (beforeunload/pagehide/visibilitychange)

### Fixed (Warning)
- localStorage 용량 초과 안전장치 (QuotaExceededError → stores 제거 후 재시도)
- 수정본 파싱 fallback 모든 회사 일반화
- 수정본 서버 업로드 (POST /api/upload-revision)
- 수정본 메일 첨부에 반영 (서버 파일 fetch)
- fetchOriginalFile() helper 분리

### Added
- `POST /api/upload-revision` — 수정본 파일 서버 저장
- `DELETE /api/upload-revision` — 정리
- `GET /api/revision-file` — 메일 첨부용 fetch
- `revisions/` 디렉토리 (gitignore)

---

## 2026-05-08 — 메일 발송 시스템 + 정산서 확정 자동 동기화

### Added
- 메일 본문에 [정산서 확정 처리] 그린 버튼 자동 삽입
- HTML 메일 구조 (table-based, 중앙 정렬 카드 600px)
- `GET /api/confirm-settlement` — 메일 링크 클릭 → 서버 기록
- `GET /api/settlement-confirmations?company=` — 회사별 확정 목록 (폴링)
- `confirmations.json` 영속 저장 (gitignore)
- 상세 페이지 10초 폴링 → 자동 [완료] 동기화
- `mail-send-modal.js` state.rowNo 전달

### Changed
- 메일 발송 시 `companyName`, `rowNo` FormData에 포함
- 정산서 확정 시 그린 버튼 [완료 ▾] 표시

---

## 2026-05-08 — v2.0 디자인 이식 + Excel 파일 실제 연동

### Added
- v2.0의 inline CSS 전체 이식 (htcbtnMd, btn-blue, preview-modal, listBox)
- SheetJS 0.20.0, jszip 3.10.1 CDN 추가
- `resources/samples/디와이피엔에프(주)_2026-04-30_정산서.xlsx`
- `fetchDypnfData()`: 페이지 로드 시 Excel 파일 fetch + 파싱 (G25/G26/G27/G31)
- 수정본 파싱: 라벨 기반 정규식 검색
- 미리보기 모달에 가맹점별 명세 21개 + 합계 행

### Changed
- 목록 페이지 진행내역 컬럼 추가 (4열 팝업: 유형/수정유무/진행내역/일시)
- 메일 발송 모달 v2.0 동일 (mail-send-modal.js/.css 복원)
- 컬러 팔레트 B안 적용 (#10b981→#059669, #2563eb→#4f46e5, #ea580c→#d97706)

---

## 2026-05-08 — v1.1 분기 시작 (worktree)

### Added
- `v1.1` 브랜치 분기 (v2.0 `3ed74cc` 커밋 기반)
- 별도 폴더 `SA_Settlement_v1_1/` (worktree)
- 포트 8081 (v2.0의 8080과 동시 운영)
- 좌측 네비게이션 + GNB만 남기고 모든 화면 리셋
- 정산 완료 내역 목록 (30개 회사 mock data)
- 정산 기간별 조회 상세 (21열 표)

---

## 작업 흐름

1. 코드 변경 → 커밋 시 본 CHANGELOG 1줄 이상 갱신
2. 큰 변경(섹션 단위)은 `v1.1-LOGIC.md`도 함께 업데이트
3. 구조 변경 시 `01_directory-structure.md` 갱신
4. UI/페이지 이동 변경 시 `03_navigation-flow.md` 갱신
