# src/pages/

## 목적
정산 완료 내역 **상세 페이지**(기업별). 목록(`../index.html`)에서 진입.

## 파일 & 기업·과금유형 매핑
| 파일 | 기업 | 과금유형 | 구현 상태 |
|---|---|---|---|
| `detail-hanwha-aerospace.html` | 한화에어로스페이스 | 1인당과금 | 풀 기능 (세금계산서·대량이체·회계전표) |
| `detail-doosan-enerbility.html` | 두산에너빌리티 | 정액제 | 와이어프레임 |
| `detail-hanwha-ocean.html` | 한화오션 | 이용료없음 | 와이어프레임 |
| `detail-hd-hyundai.html` | HD현대중공업 | 1인당과금 | 와이어프레임 |

## 경로 규칙 (이 폴더 HTML 기준)
- 공통 JS: `../assets/js/bulk-registration.js`
- 정적 JSON: `../assets/data/store_master.json`
- 엑셀 템플릿: `../../resources/templates/*.xlsx`
- 목록 복귀: `../index.html`

## 관련 문서
- [../../docs/02_process-analysis.md](../../docs/02_process-analysis.md) — 2.3~2.7 단계
- [../../docs/03_navigation-flow.md](../../docs/03_navigation-flow.md) — §4 상세 내부 플로우

## 작업 내역 (최신순)
- 2026-04-14: 파일명 영문 kebab-case 로 재명명, 내부 경로 수정

## TODO
- [ ] 두산/한화오션/HD현대 페이지에 bulk-registration.js 연동
- [ ] 과금유형별 공통 컴포넌트 추출 검토
