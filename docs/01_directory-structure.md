# 01. 디렉토리구조설계서

## 1. 목적
- Olive Ticket Service Admin "정산 관리" 영역의 프런트엔드 소스·리소스·문서를 역할별로 분리한다.
- 각 폴더에 로컬 `README.md`를 두어 **작업 맥락이 세션 간에 유실되지 않도록** 한다.

## 2. 최상위 트리
```
SA_Settlement/
├─ README.md                 # 프로젝트 개요 + 문서 인덱스
├─ docs/                     # 전역 설계 문서 & 변경 이력
├─ src/                      # 실제 프런트 소스 (HTML / JS / 정적 데이터)
│  ├─ index.html             # 업체 정산 완료 내역 목록 (진입점)
│  ├─ pages/                 # 기업별 상세 페이지
│  ├─ settlement/            # [planned] 정산하기 (실행 화면)
│  ├─ wireframes/            # 와이어프레임
│  └─ assets/
│     ├─ js/                 # 공통 스크립트 (bulk-registration.js)
│     └─ data/               # 정적 JSON (store_master.json)
└─ resources/                # 소스가 아닌 외부 리소스
   ├─ templates/             # 엑셀 출력용 원본 템플릿 (코드가 fetch)
   ├─ samples/               # 정산서 엑셀 샘플/더미 (과금유형별)
   └─ references/            # 참고 스크린샷·스냅샷
```

## 3. 각 폴더 책임

| 폴더 | 담는 것 | 담지 않는 것 |
|---|---|---|
| `docs/` | 설계서·분석서·플로우·CHANGELOG | 실행 코드, 대용량 리소스 |
| `src/pages/` | 기업별 정산 상세 HTML | 정산하기 실행 화면 (→ `src/settlement/`) |
| `src/settlement/` | [planned] 기업/기간 선택 → 정산 실행 UI | 완료 내역 조회 화면 |
| `src/assets/js/` | 브라우저에서 로드되는 공통 JS | 단일 페이지 전용 인라인 스크립트 |
| `src/assets/data/` | 런타임 fetch JSON | 정적 엑셀·이미지 |
| `resources/templates/` | **코드가 fetch 하는** 엑셀 원본 (세금계산서/대량이체/전표) | 사람 열람용 샘플 |
| `resources/samples/` | 과금유형별 정산서 샘플 & 더미 | 코드에서 참조하는 템플릿 |
| `resources/references/` | 스크린샷, DOM 스냅샷, 기획 참고물 | 최종 배포 산출물 |

## 4. 파일 명명 규칙

- 페이지 상세: `detail-{company-slug}.html`
  - `detail-hanwha-aerospace.html` · `detail-doosan-enerbility.html` · `detail-hanwha-ocean.html` · `detail-hd-hyundai.html`
- 템플릿: `{방향/용도}.xlsx` — `reverse`, `forward_50`, `forward_101`, `reverse_detail`, `bulk_transfer`
- 샘플: `{기업명}_{yyyymm}_정산서_{과금유형}.xlsx` 또는 `settlement_{type}.xlsx`
- 문서: `NN_{kebab-slug}.md` (순번 prefix)

## 5. 확장 가이드라인

### 신규 기업 상세 페이지 추가 시
1. `src/pages/detail-{new-slug}.html` 생성 (기존 파일 복제)
2. `src/index.html` 목록 테이블에 row + 링크 추가
3. `docs/02_process-analysis.md` 의 "과금유형 매핑" 표 갱신
4. `src/pages/README.md` 파일 목록 테이블 갱신

### 신규 템플릿 추가 시
1. `resources/templates/{name}.xlsx` 업로드
2. `src/assets/js/bulk-registration.js` 에 `templateUrl: "../../resources/templates/{name}.xlsx"` 추가
3. `resources/templates/README.md` 에 용도 기술

### 신규 과금유형/샘플 추가 시
1. `resources/samples/` 에 엑셀 배치
2. `resources/samples/README.md` 표 갱신

## 6. 경로 계산 규칙
- HTML에서 fetch/script src는 **해당 HTML 위치 기준** 상대경로를 사용한다.
- 상세 페이지는 `src/pages/` 에 있으므로:
  - 공통 JS → `../assets/js/...`
  - 정적 JSON → `../assets/data/...`
  - 템플릿 엑셀 → `../../resources/templates/...`
- `src/index.html` 기준:
  - 상세 → `pages/detail-*.html`

## 7. 참조
- 업무 프로세스: [02_process-analysis.md](./02_process-analysis.md)
- 화면 이동: [03_navigation-flow.md](./03_navigation-flow.md)
- 작업 내역: [CHANGELOG.md](./CHANGELOG.md)
