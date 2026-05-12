# 📚 docs/ — v1.1 문서 허브

> 모든 설계·로직·이력 문서를 한 곳에서 탐색.

## 🗺 문서 지도

```
👋 처음 보는 개발자
   └─ ../README.md (프로젝트 루트, 빠른 시작)
       └─ docs/v1.1-LOGIC.md ⭐ 메인 명세서
           ├─ docs/01_directory-structure.md (구조)
           ├─ docs/02_process-analysis.md (업무 흐름)
           ├─ docs/03_navigation-flow.md (페이지 이동)
           └─ docs/CHANGELOG.md (변경 이력)
```

## 📖 어떤 문서를 봐야 하나?

| 상황 | 추천 문서 |
|---|---|
| **처음 프로젝트 받음** | `../README.md` → `v1.1-LOGIC.md` 1~5절 |
| **새 화면 추가 작업** | `v1.1-LOGIC.md` §4, §11 (페이지·컬러) |
| **API 통합** | `v1.1-LOGIC.md` §6 (서버 API 명세) |
| **메일/확정 로직 수정** | `v1.1-LOGIC.md` §8, §9, §12 (메일·동기화·보안) |
| **수정본 처리 수정** | `v1.1-LOGIC.md` §10 |
| **트러블슈팅** | `v1.1-LOGIC.md` §14 (엣지 케이스) |
| **운영 배포 준비** | `v1.1-LOGIC.md` §12, `CHANGELOG.md` |

## 📋 문서 목록

| 파일 | 분량 | 갱신 주기 |
|---|---|---|
| ⭐ [`v1.1-LOGIC.md`](./v1.1-LOGIC.md) | ~600줄 (14 섹션) | 기능 변경 시 |
| [`01_directory-structure.md`](./01_directory-structure.md) | 폴더 구조 설계 | 구조 변경 시 |
| [`02_process-analysis.md`](./02_process-analysis.md) | 업무 프로세스 | 흐름 변경 시 |
| [`03_navigation-flow.md`](./03_navigation-flow.md) | LNB/GNB/페이지 이동 | UI 변경 시 |
| [`CHANGELOG.md`](./CHANGELOG.md) | 작업 이력 | **매 커밋/세션** |

## ✏ 문서 작성 규칙

1. **`v1.1-LOGIC.md` 가 단일 진실 원천 (single source of truth)**
2. 01~03 문서는 보조 자료 (구조/프로세스/네비 전용)
3. 코드 변경 시 관련 섹션 즉시 갱신
4. CHANGELOG는 매 커밋 단위로 한 줄 이상 기록
5. 마크다운 표·코드 블록·다이어그램 적극 활용
6. 미구현(planned) 기능은 제거하지 말고 `planned` 태그로 명시
