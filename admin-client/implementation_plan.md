# Implementation Plan - Voucher Support & Online Only Payment

## Proposed Changes

### 1. Backend
- **AdminMembershipController**: Add `GET /api/admin/customers/{userId}/vouchers`.
- **OrderSessionController**: Update `createPayment` to apply `promotionName`.

### 2. Frontend
- **ReservationDetailPage.jsx**: 
    - Remove Cash button.
    - Add Voucher selector (auto-fetch from customer).
    - Send `voucherCode` in payment request.
-> phần này bạn hãy xem lại cách xử lí khi khách hàng thanh toán online và thảo luận lại với tôi
## Open Questions
- Auto-select best voucher? -> no
- Allow manual entry? -> yes
