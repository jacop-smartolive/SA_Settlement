# 02. 프로세스분석서

## 1. 전체 업무 플로우

```
[정산하기]                         [정산 완료 내역]
(LNB: 업체 정산)                   (LNB: 업체 정산 완료 내역)

  기업 선택                             목록(index)
     │                                    │ (행 클릭)
     ▼                                    ▼
  정산 기간 선택                       상세(detail-*)
     │                                    │
     ▼                         ┌──────────┼──────────────┐
  정산 실행 ────(완료 레코드 생성)─┤          │              │
                                 ▼          ▼              ▼
                          세금계산서    대량이체         회계전표
                          일괄처리      생성             생성
                          (정/역,50/101)
                                 │          │              │
                                 └──── 수정본 관리 (첨부/수정/삭제) ────┘
```

## 2. 단계별 분석

### 2.1 [planned] 정산하기 — `src/settlement/` (미구현)
| 항목 | 내용 |
|---|---|
| 입력 | 기업 선택 (드롭다운/검색), 정산 기간 (시작/종료 월) |
| 처리 | 해당 기간 거래 집계 → 과금유형별 정산 규칙 적용 → 완료 레코드 생성 |
| 출력 | `업체 정산 완료 내역` 목록에 row 추가 (`src/index.html`) |
| 관련 파일 | (신설 예정) `src/settlement/index.html`, 집계 로직 JS |
| 상태 | `planned` — 인터페이스/디자인 TBD |

### 2.2 정산 완료 내역 목록 조회 — `src/index.html`
| 항목 | 내용 |
|---|---|
| 검색 조건 | 기업체명 / 사업자번호 / 법인번호 |
| 표시 컬럼 | 번호, 기업체, 사업자등록번호, 대표자, 세금계산서 이메일, 완료 건수, 마지막 완료일 |
| 동작 | 기업체명 클릭 → 상세 페이지 이동 (`pages/detail-*.html`) |

### 2.3 상세 진입 — `src/pages/detail-*.html`
4개 기업이 각각 별도 HTML. **과금유형 매핑**:

| 파일 | 기업 | 과금유형 | 비고 |
|---|---|---|---|
| `detail-hanwha-aerospace.html` | 한화에어로스페이스 | 1인당과금 (주력) | 풀 기능 구현 (세금계산서/대량이체/전표) |
| `detail-doosan-enerbility.html` | 두산에너빌리티 | 정액제 | 와이어프레임 수준 |
| `detail-hanwha-ocean.html` | 한화오션 | 이용료없음 | 와이어프레임 수준 |
| `detail-hd-hyundai.html` | HD현대중공업 | 1인당과금 | 와이어프레임 수준 |

### 2.4 세금계산서 일괄처리
| 항목 | 내용 |
|---|---|
| 입력 | 상세 화면 "세금계산서" 섹션의 [다운로드] 버튼 클릭 |
| 옵션 | 정방향(forward) 50건/101건, 역방향(reverse) |
| 코드 | `src/assets/js/bulk-registration.js` — `getReverseConfig()`, `getForward50Config()`, `getForward101Config()` |
| 템플릿 | `resources/templates/reverse.xlsx`, `forward_50.xlsx`, `forward_101.xlsx` |
| 출력 | `세금계산서_일괄등록_{타입}_{날짜}.xlsx` |

### 2.5 대량이체 생성
| 항목 | 내용 |
|---|---|
| 입력 | 상세 화면 "대량이체" → 다운로드 |
| 코드 | `bulk-registration.js` — `generateTransferExcel()` (L516) |
| 템플릿 | `resources/templates/bulk_transfer.xls` |
| 출력 | `{기업명}_{연도}년{월}월_대량이체_원본_{날짜}.xlsx` |

### 2.6 회계전표 생성
| 항목 | 내용 |
|---|---|
| 입력 | 상세 화면 "회계전표" → 다운로드 |
| 코드 | `bulk-registration.js` — `generateSlipExcel()` (L596) |
| 템플릿 | `resources/templates/reverse_detail.xlsx` (fetch) |
| 출력 | `{기업명}_{연도}년{월}월_전표_원본_{날짜}.xlsx` |

### 2.7 내역 다운로드 (수정본 관리)
- 원본(generateDetailExcel, L449) + 수정본(업로드/첨부/삭제/다운로드) 이력 관리
- 각 row별 [미리보기 / 파일수정 / 다운로드 / 삭제] 액션 (`detail.html` L1027~1030)

## 3. 과금유형별 분기 포인트
- **이용료없음**: 정산 금액 0, 세금계산서 발행 대상에서 제외 가능
- **정액제**: 월정액 단일 항목
- **1인당과금**: 사용자 수 × 단가, 상세 명세 다수 row
- **구내식당**: 별도 탭 (`업체 정산 완료 내역` 서브탭 3번째)

## 4. 데이터 흐름 (요약)
```
store_master.json  ─┐
SUPPLIER(bulk-reg) ─┼─► buildVals() ─► 엑셀 셀 주입 ─► JSZip ─► Blob ─► 다운로드
사용자 선택 기간   ─┘
```

## 5. 연관 파일
- JS: `src/assets/js/bulk-registration.js`
- Data: `src/assets/data/store_master.json`
- Templates: `resources/templates/*.xlsx`
- Samples: `resources/samples/*.xlsx` (테스트·기획 참고용)
