# docs/

## 목적
프로젝트 전역의 설계 문서와 변경 이력을 모은다. 개별 폴더의 로컬 README 와 달리, 여기는 **어떤 폴더를 건드려도 참조해야 하는** 교차 문서다.

## 파일 목록
| 파일 | 역할 |
|---|---|
| [01_directory-structure.md](./01_directory-structure.md) | 디렉토리구조설계서 — 폴더 책임·명명규칙·확장 가이드 |
| [02_process-analysis.md](./02_process-analysis.md) | 프로세스분석서 — 정산하기→완료내역까지 업무 단계 |
| [03_navigation-flow.md](./03_navigation-flow.md) | 네비게이션플로우 — LNB/화면 이동 다이어그램 |
| [CHANGELOG.md](./CHANGELOG.md) | 세션별 작업 이력 (맥락 유지용, 매 세션 갱신) |

## 운영 규칙
- 구조/프로세스/네비게이션에 영향이 가는 변경은 **반드시** 3종 문서 + CHANGELOG 동시 갱신.
- 폴더별 변경은 해당 폴더 `README.md` 의 "작업 내역" 섹션에도 기록.
- 미구현(planned) 기능은 제거하지 말고 `planned` 태그로 명시만 한다.
