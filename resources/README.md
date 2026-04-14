# resources/

## 목적
실행 코드가 아닌 **리소스 파일**. 코드가 fetch 하는 템플릿, 기획/테스트용 샘플, 참고 스크린샷을 담는다.

## 하위 구조
| 폴더 | 용도 | 코드 참조 여부 |
|---|---|---|
| `templates/` | 엑셀 출력 원본 템플릿 | **O** — `src/assets/js/bulk-registration.js` 가 fetch |
| `samples/` | 정산서 엑셀 샘플/더미 (과금유형별) | X (열람용) |
| `references/` | 스크린샷, DOM 스냅샷 | X (참고용) |

## 분류 기준 (중요)
- 코드가 런타임에 fetch → `templates/`
- 사람이 기획/테스트/비교 목적으로 여는 파일 → `samples/`
- 화면 복원·기획 참고 자료 → `references/`

## 관련 문서
- [../docs/01_directory-structure.md](../docs/01_directory-structure.md) §3

## 작업 내역 (최신순)
- 2026-04-14: `downloads/` 에 섞여있던 템플릿/샘플을 분리하여 이 폴더로 이동
