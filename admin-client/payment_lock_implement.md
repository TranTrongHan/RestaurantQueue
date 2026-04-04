# Payment Lock & Session Management Integration Plan

This plan outlines the steps to implement the "Payment Lock" mechanism for the Tablet (Customer Client), ensuring that ordering is blocked once payment has been requested and that all conditions are met before a request can be sent.

## User Review Required

> [!IMPORTANT]
> The "Lock UI" will trigger when the reservation document status changes to `REQUEST_PAYMENT`. Ordering will also be blocked for this state.

## Proposed Changes

### [MODIFY] [CustomerOrderingPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/CustomerOrderingPage.jsx)

#### 1. Payment Request Logic (`requestPayment` function)
- **Condition Check**: Update to specifically block the request if any items in the `orderItems` sub-collection are `PENDING` or `COOKING`.
- **Confirmation Box**: Add a `window.confirm` dialog asking the user to confirm the payment request and informing them that they cannot order more thereafter.
- **Endpoint Update**: Change the API call from `/api/order_session/${sessionId}/request-payment` to `/api/order_session/requestPayment/${sessionId}`.

#### 2. Order Placement Logic (`placeOrder` function)
- **Status Block**: Extend the blocking condition to include `reservationRealtime.status === "REQUEST_PAYMENT"`.
- **Error Handling**: Add logic to handle Backend error code `3005` (Table locked). If detected, show a specific toast and potentially refresh the session data.

#### 3. UI Overlay ("Dine-in Lock")
- **State Check**: Update the overlay trigger to show when `reservationRealtime?.status === "REQUEST_PAYMENT"`.

## Open Questions

1.  **Field for status**: Just to confirm, the "Lock" status from the backend will be in the `status` field of the reservation document as `REQUEST_PAYMENT`? My current implementation assumes this based on your `.md` file. yes it is

## Verification Plan

### Manual Verification
- **Condition Check**: Attempt to request payment while an item is "Cooking" and confirm the toast message appears.
- **Lock Check**: Request payment, confirm the overlay appears, and verify that the cart "Send to Kitchen" button is disabled or blocked.
- **API Check**: Verify the new endpoint `POST /api/order_session/requestPayment/{sessionId}` is called correctly.
