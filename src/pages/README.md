# src/pages/ — 상세 페이지

> v1.1 정산 기간별 조회 상세 화면

## 📄 파일

| 파일 | 설명 |
|---|---|
| `settlement-detail.html` | 정산 기간별 조회 상세 (단일 페이지, URL 파라미터로 회사 구분) |

## 🔗 URL

```
http://localhost:8081/src/pages/settlement-detail.html?company={기업명}&count={정산건수}
```

예시:
```
?company=디와이피엔에프(주)&count=77
?company=한국전력공사&count=120
```

## 📋 주요 기능

- 21열 표 (12 데이터 + 9 액션)
- 정산서 워크플로우 (원본 → 수정본 → 완료)
- 메일 발송 (정산서 확정 버튼 포함)
- 5종 다운로드 (가맹 역/정발행, 대량이체, 회계전표)
- Excel 파일 동적 로드 (`fetchDypnfData()`)
- 수정본 파일 파싱 + 서버 업로드
- 미리보기 모달 (21개 가맹점 명세)
- 10초 폴링 (메일 확정 자동 동기화)

## 📚 자세한 로직

[`/docs/v1.1-LOGIC.md`](../../docs/v1.1-LOGIC.md) — §4 페이지 흐름, §7 정산서 워크플로우, §10 수정본 처리
