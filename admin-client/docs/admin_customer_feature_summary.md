# Admin Customer Management - Feature Summary

This document summarizes the newly implemented administrative customer management features.

## 1. API Endpoints Reference

| Action | Endpoint | Method | Query Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **Search Customers** | `/api/admin/customers` | `GET` | `page`, `size`, `search` | Paginated search by Name, Phone, or Email. |
| **Get Detail** | `/api/admin/customers/{userId}` | `GET` | - | Retrieve full profile of a specific customer. |
| **Update Info** | `/api/admin/customers/{userId}` | `PUT` | - | Update customer profile details. |
| **Order History** | `/api/admin/customers/{userId}/orders` | `GET` | - | Unified list of ONLINE and DINE_IN orders. |

## 2. Data Models (DTOs)

### CustomerOrderHistoryResponse
Provides a unified view of different order types:
- **Identifier**: `orderId`, `orderType` (ONLINE / DINE_IN).
- **Financials**: `subTotal`, `discountAmount`, `totalAmount`, `isPaid`, `status`.
- **Items**: List of `OrderItemResponse` (name, quantity, price, status).
- **Metadata**: Contextual info like `deliveryAddress` (Online) or `tableName` (Dine-in).

## 3. Implementation Details

- **Efficient Searching**: Uses a custom JPQL query in `UserRepository` for case-insensitive partial matches across multiple fields.
- **Unified Logic**: `OrderManagementService` handles the complex aggregation of different order entities (`OnlineOrder` vs `OrderSession`) into a single chronological timeline.
- **Dine-In Support**: Correctly traverses relationships from `Order` -> `OrderSession` -> `Reservation` -> `User` to find in-house history.

## 4. UI Integration Notes

When a customer is selected in the Admin Dashboard:
1.  Use `GET /api/admin/customers/{userId}` to populate the profile form.
2.  Use `GET /api/admin/customers/{userId}/orders` to populate the "Order History" tab.
3.  The `metadata` field in order history should be used to display specific context (e.g., "Dining at Table 4" vs "Delivery to [Address]").
