# CHANGELOG

세션별 작업 내역을 최신순으로 누적한다. 매 세션 종료 전 반드시 갱신.

## 형식
```
## YYYY-MM-DD — 세션 주제
### Added / Changed / Moved / Removed / Fixed / Planned
- 변경 요약 (관련 파일)
```

---

## 2026-04-14 — 폴더 재구성 및 설계문서 체계 수립

### Moved
- `index.html` → `src/index.html`
- `detail.html` → `src/pages/detail-hanwha-aerospace.html`
- `detail2.html` → `src/pages/detail-doosan-enerbility.html`
- `detail3.html` → `src/pages/detail-hanwha-ocean.html`
- `detail4.html` → `src/pages/detail-hd-hyundai.html`
- `wireframe_detail.html` → `src/wireframes/wireframe-detail.html`
- `downloads/bulk-registration.js` → `src/assets/js/bulk-registration.js`
- `downloads/store_master.json` → `src/assets/data/store_master.json`
- `downloads/templates/*` (5) → `resources/templates/`
- `downloads/settlement_*.xlsx` (3), `downloads/dummy_*.xlsx` (2) → `resources/samples/`
- `기업명_*_정산서_*.xlsx` (3) → `resources/samples/`
- `screenshot_full.png`, `snapshot_detail.txt` → `resources/references/`
- `downloads/` 디렉토리 제거

### Added
- `docs/01_directory-structure.md` — 디렉토리구조설계서
- `docs/02_process-analysis.md` — 프로세스분석서 (정산하기→완료까지 전체 흐름)
- `docs/03_navigation-flow.md` — 네비게이션플로우 (Mermaid)
- `docs/CHANGELOG.md` — 이 파일
- 각 폴더 `README.md` (src, src/pages, src/settlement, src/wireframes, src/assets, resources, resources/templates, resources/samples, resources/references, docs)
- `src/settlement/` 폴더 신설 (planned 자리)

### Changed (경로 수정)
- `src/index.html` — 목록 내 상세 링크 4건을 `pages/detail-*.html` 로 교체
- `src/pages/detail-hanwha-aerospace.html`
  - `downloads/bulk-registration.js?v=8` → `../assets/js/bulk-registration.js?v=8`
  - `downloads/store_master.json` → `../assets/data/store_master.json`
  - `href="index.html"` → `href="../index.html"`
- `src/pages/detail-doosan-enerbility.html`, `detail-hanwha-ocean.html`, `detail-hd-hyundai.html`
  - `href="index.html"` → `href="../index.html"`
- `src/assets/js/bulk-registration.js`
  - L63/L86/L106: `templateUrl: "downloads/templates/*.xlsx"` → `"../../resources/templates/*.xlsx"`
  - L372: `fetch("downloads/templates/reverse_detail.xlsx")` → `"../../resources/templates/reverse_detail.xlsx"`

### Planned
- `src/settlement/` 정산 실행 화면 구현 (기업 선택 → 기간 선택 → 실행)
- 두산에너빌리티/한화오션/HD현대중공업 상세 페이지 풀 기능 이식 (현재 와이어프레임 수준)

---

## 2026-04-13 — 4개 기업 상세 페이지 및 세금계산서/지급/회계전표 일괄처리 구현
- 기존 커밋 1668e39 참조

## 2026-04-09 — 상세 페이지 UI 개선 / 정산 완료 내역 목록·상세
- 커밋 d6eadfe, 3656362 참조
