# New Payment Flow Implementation Plan

This plan outlines the steps to implement the updated payment flow for the Receptionist (Admin Client) and ensure the Tablet (Customer Client) resets automatically upon payment completion.

## User Review Required

> [!IMPORTANT]
> The Receptionist will be redirected to the VNPay checkout page and back to the Admin Dashboard. The Tablet UI will detect the payment success via Firestore document removal and reset itself.

## Proposed Changes

### Admin Client (Receptionist UI)

#### [NEW] [VNPayReturnPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/VNPayReturnPage.jsx)
- Handles the return from VNPay.
- Extracts query parameters and calls `GET /api/order_session/vnpayReturn`.
- Displays success/failure message and a button to return to the Reservations page.

#### [MODIFY] [App.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/App.jsx)
- Register the `/payment-return` route pointing to `VNPayReturnPage`.

#### [MODIFY] [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx)
- Update `handleVNPayPayment` to pass `returnUrl` (pointing to the new `/payment-return` page).
- Instead of `window.open`, use `window.location.href` to redirect the current tab (per standard payment flows).

### Customer Client (Tablet UI)

#### [MODIFY] [CustomerOrderingPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/CustomerOrderingPage.jsx)
- Update the `onSnapshot` listener for the reservation document.
- If the document is deleted (detected via `docSnap.exists() === false`), perform the following:
  - Clear `sessionStorage` (customerJwt).
  - Clear the local `cart`.
  - Display a success/thank you message or redirect to a landing page (Check-in screen).

## Open Questions

1.  **Return URL**: Should we use a separate window for payment or redirect the main admin window? The plan assumes a redirect for the main window, which is more robust for session management.
2.  **Success Landing**: After a successful payment, what specifically should the Tablet show if not the Check-in screen? I'll default to a "Thank You" message that then resets to Check-in.

## Verification Plan

### Automated/Manual Tests
- **Manual Verification**: Trigger a VNPay payment as a receptionist, complete the payment (using sandbox), and verify the redirect to the return page.
- **Tablet Reset**: Verify the Tablet UI automatically transitions from "Waiting for Payment" to the "Thank You/Check-in" screen when the payment is finalized on the admin side.
