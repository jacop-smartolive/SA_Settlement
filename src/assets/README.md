# src/assets/

## 목적
HTML에서 로드되는 공통 스크립트와 정적 데이터.

## 하위 구조
| 경로 | 역할 |
|---|---|
| `js/bulk-registration.js` | 세금계산서/대량이체/회계전표 엑셀 생성 공통 스크립트 |
| `data/store_master.json` | 가맹점 마스터 데이터 (대표자/이메일) — 상세 페이지에서 fetch |

## 경로 규칙 (bulk-registration.js 내부)
fetch/templateUrl은 **스크립트를 로드한 HTML 위치 기준** 으로 해석된다.
현재 소비자는 `src/pages/detail-*.html` 이므로:
```
../../resources/templates/{reverse|forward_50|forward_101|reverse_detail}.xlsx
```

## 관련 함수 (bulk-registration.js)
| 함수 | 역할 | 라인(대략) |
|---|---|---|
| `getReverseConfig()` | 역방향 세금계산서 템플릿 설정 | L57~ |
| `getForward50Config()` | 정방향 50건 | L84~ |
| `getForward101Config()` | 정방향 101건 | L104~ |
| `generateDetailExcel()` | 내역 다운로드 | L449~ |
| `generateTransferExcel()` | 대량이체 | L516~ |
| `generateSlipExcel()` | 회계전표 | L596~ |

## 관련 문서
- [../../docs/02_process-analysis.md](../../docs/02_process-analysis.md) §2.4~2.6

## 작업 내역 (최신순)
- 2026-04-14: `downloads/` → `src/assets/js,data/` 로 분리, `templateUrl` 경로 재계산
