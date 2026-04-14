# resources/templates/

## 목적
`src/assets/js/bulk-registration.js` 가 **런타임에 fetch** 하는 엑셀 원본 템플릿. **수정 시 코드 경로도 함께 확인**.

## 파일 목록
| 파일 | 용도 | 참조 함수 |
|---|---|---|
| `reverse.xlsx` | 역방향 세금계산서 | `getReverseConfig()` |
| `forward_50.xlsx` | 정방향 세금계산서 50건 | `getForward50Config()` |
| `forward_101.xlsx` | 정방향 세금계산서 101건 | `getForward101Config()` |
| `reverse_detail.xlsx` | 회계전표 (내역 포함 역방향) | `generateSlipExcel()` fetch |
| `bulk_transfer.xls` | 대량이체 업로드 양식 | `generateTransferExcel()` |

## 참조 경로 (bulk-registration.js 에서)
```js
templateUrl: "../../resources/templates/{name}.xlsx"
```
(스크립트 로드 HTML = `src/pages/detail-*.html` 기준 상대경로)

## 관련 문서
- [../../docs/02_process-analysis.md](../../docs/02_process-analysis.md) §2.4~2.6

## 작업 내역 (최신순)
- 2026-04-14: `downloads/templates/` 에서 이동
