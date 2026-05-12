# src/assets/ — 공통 자산

## 📁 구조

```
assets/
├─ css/
│  └─ mail-send-modal.css   # 메일 발송 모달 스타일
├─ js/
│  ├─ mail-send-modal.js    # 메일 발송 모달 (v2.0 이식)
│  └─ bulk-registration.js  # 일괄등록 (세금계산서 양식)
└─ data/
   └─ store_master.json     # 가맹점 마스터 (참조 데이터)
```

## 📌 mail-send-modal

- `MailSendModal.open({ companyName, rowNo, attachmentName, fetchAttachment, onSuccess })`
- `SendHistoryModal.open({ history })`

호출 위치: `src/pages/settlement-detail.html` → `sendSettlementMail()`

## 📌 bulk-registration

홈택스/U+ 양식의 일괄등록 ZIP 생성. v1.1에선 적극 사용되지 않으나 v2.0 호환을 위해 보존.

## 📚 자세한 사용법

[`/docs/v1.1-LOGIC.md`](../../docs/v1.1-LOGIC.md) §8 메일 발송 시스템
