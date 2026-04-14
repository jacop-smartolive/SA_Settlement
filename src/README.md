# src/

## 목적
실제 브라우저에서 실행되는 프런트엔드 소스. 이 폴더 하위는 **HTML 을 직접 열면 동작**하도록 구성.

## 파일 & 폴더
| 항목 | 역할 | 상태 |
|---|---|---|
| `index.html` | 업체 정산 완료 내역 목록 (진입점) | 구현 |
| `pages/` | 기업별 정산 상세 페이지 | 한화에어로 풀/나머지 3사 와이어프레임 |
| `settlement/` | 정산하기 (기업 선택→기간→실행) | **planned** |
| `wireframes/` | 기획 단계 와이어프레임 | 참조용 |
| `assets/js/` | 공통 스크립트 (`bulk-registration.js`) | 구현 |
| `assets/data/` | 정적 JSON (`store_master.json`) | 구현 |

## 관련 문서
- [../docs/01_directory-structure.md](../docs/01_directory-structure.md)
- [../docs/02_process-analysis.md](../docs/02_process-analysis.md)
- [../docs/03_navigation-flow.md](../docs/03_navigation-flow.md)

## 작업 내역 (최신순)
- 2026-04-14: 전체 파일 src/ 하위로 이동, 내부 링크 경로 수정

## TODO
- [ ] `settlement/` 정산 실행 화면 신규 구축
- [ ] `pages/` 의 두산/한화오션/HD현대 상세를 한화에어로 수준으로 고도화
