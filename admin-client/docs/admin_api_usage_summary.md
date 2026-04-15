# Admin Client - API Usage Audit Summary

This file summarizes all API endpoints currently used by the `admin-client` dashboard pages. This list will facilitate the Backend refactoring to a unified `/api/admin` prefix and the removal of the `STAFF` role.

## 1. Authentication & Profile
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | `LoginPage.jsx` | Administrative login |
| **GET** | `/auth/profile` | `LoginPage.jsx`, `Layout` | Fetch current user role and session |

## 2. Customer Management
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/admin/customers` | `CustomersPage.jsx` | List customers with search/pagination |
| **GET** | `/admin/customers/{userId}` | `CustomerDetailPage.jsx` | Fetch detailed customer profile |
| **PUT** | `/admin/customers/{userId}` | `CustomerDetailPage.jsx` | Update customer info (Name, Phone, etc.) |
| **GET** | `/admin/customers/{userId}/orders` | `CustomerDetailPage.jsx` | Fetch customer's order history |

## 3. Product & Menu Management
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/menu_items/admin` | `ProductsPage.jsx` | List products with admin-only details |
| **POST** | `/menu_items/admin` | `ProductsPage.jsx` | Create product (Multipart/Form-Data) |
| **PUT** | `/menu_items/admin/{id}` | `ProductsPage.jsx` | Update product (Multipart/Form-Data) |
| **DELETE** | `/menu_items/admin/{id}` | `ProductsPage.jsx` | Permanent deletion of record |
| **PATCH** | `/menu_items/admin/{id}/status`| `ProductsPage.jsx` | Toggle `isAvailable` status |
| **GET** | `/categories` | `ProductsPage.jsx` | Fetch categories for selection |

## 4. Online Order Operations
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/online_order/admin` | `OnlineOrdersPage.jsx` | List online orders with filters |
| **GET** | `/online_order/admin/{id}` | `OnlineOrdersPage.jsx` | Fetch specific online order details |

## 5. Kitchen & Order Fulfillment
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **PUT** | `/order_item/{id}/status` | `KitchenOrdersPage.jsx` | Update cooking status (`COOKING`, `DONE`) |

## 6. Reservations & In-House Dining
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/reservation` | `ReservationsPage.jsx` | List bookings with status filters |
| **POST** | `/reservation/{id}` | `ReservationsPage.jsx` | Confirm Check-in (Starts an `OrderSession`) |
| **POST** | `/order_session/{sessionId}` | `ReservationsPage.jsx` | Direct Cash Payment (Closing session) |
| **POST** | `/order_session/createPayment/{id}`| `ReservationsPage.jsx` | Generate VNPay URL for session |

## 7. Loyalty & Rewards Program
| Method | Endpoint | Page | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/admin/membership-tiers` | `Tiers/Vouchers` | Fetch loyalty tier definitions |
| **POST** | `/admin/membership-tiers` | `MembershipTiersPage.jsx` | Create level (spending, rates) |
| **PUT** | `/admin/membership-tiers/{id}` | `MembershipTiersPage.jsx` | Update level parameters |
| **DELETE**| `/admin/membership-tiers/{id}` | `MembershipTiersPage.jsx` | Remove loyalty level |
| **GET** | `/admin/vouchers` | `VouchersPage.jsx` | List all promotions/vouchers |
| **POST** | `/admin/vouchers` | `VouchersPage.jsx` | Create promotion (Targets tiers/dates) |
| **DELETE**| `/admin/vouchers/{id}` | `VouchersPage.jsx` | Revoke/Delete voucher |
| **GET** | `/admin/points/report` | `PointsReportPage.jsx` | Global point transaction logs |
| **POST** | `/admin/points/adjust` | `PointsReportPage.jsx` | Manual point correction/addition |

## 8. Development Notes for BE Refactoring
- **Suggested Unified Prefix**: `/api/admin`
- **Role Consolidation**: All endpoints above should require `ROLE_ADMIN`. Use of `ROLE_STAFF` is being deprecated as per current requirements.
- **Path Parameter Standardization**: Most endpoints follow `{id}` or `{userId}`. Ensure consistent naming in Spring boot `@PathVariable`.
