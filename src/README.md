# src/ — 프런트엔드 소스

> v1.1 브라우저 코드 (HTML/CSS/JS)

## 📁 구조

```
src/
├─ index.html              # 진입점 — 정산 완료 내역 목록
├─ pages/
│  └─ settlement-detail.html   # 정산 기간별 조회 상세
└─ assets/
   ├─ css/mail-send-modal.css
   ├─ js/
   │  ├─ mail-send-modal.js    # 메일 발송 모달
   │  └─ bulk-registration.js  # 일괄등록
   └─ data/
      └─ store_master.json
```

## 🔗 진입점

http://localhost:8081/**src/index.html**

## 📚 자세한 명세

- 페이지 흐름: [`/docs/v1.1-LOGIC.md`](../docs/v1.1-LOGIC.md) §4
- 데이터 모델 (localStorage 3종): [`/docs/v1.1-LOGIC.md`](../docs/v1.1-LOGIC.md) §5
- 컬러 시스템 (B안): [`/docs/v1.1-LOGIC.md`](../docs/v1.1-LOGIC.md) §11

## ⚠ 외부 의존성

브라우저에서 CDN으로 로드:
- SheetJS (xlsx-0.20.0)
- JSZip (3.10.1)
- Google Fonts (Nanum Gothic)
