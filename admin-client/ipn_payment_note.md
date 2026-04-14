# Fix Payment Lifecycle & Loyalty Issues

The user identified a "double point credit" issue. Analysis confirms it was due to redundant calls in `PaymentManagerService` and `PaymentService`. Recent edits by the user resolved the double points. However, a follow-up issue remains: vouchers are not marked as used when payments are finalized via the backend IPN (Instant Payment Notification).

## Status of Reported Issues

### 1. Double Point Credit
- **Diagnosis**: Both `PaymentManagerService.finalizePayment` and `PaymentService.createBill` were calling the point addition logic.
- **Status**: **RESOLVED** by the user's recent edit which removed the redundant call in `PaymentManagerService`.

### 2. Single Bill Entry
- **Diagnosis**: `PaymentService` has an idempotency check (`billRepository.existsByOrder_OrderId`) which correctly prevents duplicate bills.
- **Status**: **CONFIRMED CORRECT**.

## Identified Missing Logic (Voucher Persistence)

### The IPN Problem
When VNPay calls our backend IPN endpoint:
- It does **not** include our custom query parameters like `promotionName`.
- `finalizePayment` currently expects `promotionName` in the parameter map.
- If `promotionName` is missing, `BillService.buildBill` cannot mark the voucher as used.
- **Result**: The user uses the voucher, get the discount, but the voucher remains "unused" in their wallet.

## Proposed Changes

### [Component Name] Backend (Payment Integration)

#### [MODIFY] [PaymentManagerService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/payment/PaymentManagerService.java)
- Update `pendingPayments` to store a small metadata object instead of just the URL string.
- The metadata will include the `voucherCode` provided at the time of payment initiation.
- In `finalizePayment`, if `promotionName` is null in the request parameters (common in IPN), retrieve it from the cache using the `txnRef`.

## Verification Plan

### Manual Verification
- Initiate a payment with a voucher from the Admin dashboard.
- Simulate an IPN call to the backend (or wait for the real one).
- Verify that the resulting Bill in the database records the discount correctly.
- Verify that the customer's voucher is successfully marked as `isUsed = true`.
- Verify that loyalty points are added exactly once.
