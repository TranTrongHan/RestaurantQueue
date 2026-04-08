# Implementation Plan - Admin Online Order API

This plan outlines the steps to add API endpoints for administrators to list and view details of online orders.

## User Review Required

> [!IMPORTANT]
> The pagination logic uses `PageResponse`, as requested. I will default the sort order to `createdAt` descending to show the latest orders first.
> 
> [!NOTE]
> I will update the security configuration to ensure only users with the `ADMIN` role can access these new endpoints.

## Proposed Changes

### `com.tth.RestaurantApplication.service`

#### [MODIFY] [OnlineOrderService.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/OnlineOrderService.java)
- Add `getAllOnlineOrders(int page, int size)` method.
- Add `getOnlineOrderDetail(Integer onlineOrderId)` method.
- Import `PageRequest`, `Pageable`, `Sort`, and `PageResponse`.

---

### `com.tth.RestaurantApplication.controller`

#### [MODIFY] [OnlineOrderController.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/OnlineOrderController.java)
- Add `GET /api/online_order/admin` endpoint for paginated listing.
- Add `GET /api/online_order/admin/{onlineOrderId}` endpoint for order details.
- Ensure these endpoints use `ApiResponse` and `PageResponse` as appropriate.

---

### `com.tth.RestaurantApplication.configs`

#### [MODIFY] [SecurityConfig.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/configs/SecurityConfig.java)
- Update request matchers to allow `ADMIN` role access to `/api/online_order/admin/**`.

## Open Questions

- Should we include any specific filtering (e.g., by status, user, or date range) for the admin list API, or is a simple paginated list sufficient for now?

## Verification Plan

### Automated Tests
- I'll check the logs and ensure the application starts without issues after changes.
- Since I don't have a full integration test suite that I can run easily here, I'll rely on manual verification via browser if possible, or simply verify the code correctness.

### Manual Verification
- Verify that only `ADMIN` can access the new endpoints.
- Verify that the response format matches `PageResponse` and `ApiResponse`.

---

# Tài liệu Tích hợp API Online Order

Dưới đây là chi tiết về các API dành cho đơn hàng online đã được triển khai, bao gồm cả các API dành cho Admin và API công khai dành cho Khách hàng.

## 1. APIs dành cho Admin

### 1.1. Danh sách đơn hàng (Phân trang & Lọc)
- **Endpoint**: `GET /api/online_order/admin`
- **Tham số**:
    - `page` (int, mặc định `1`)
    - `size` (int, mặc định `10`)
    - `customer` (string): Lọc theo tên/email khách hàng.
    - `isPaid` (boolean): Lọc theo trạng thái thanh toán.
    - `fromDate`, `toDate` (`yyyy-MM-dd`): Lọc theo khoảng thời gian.
- **Phản hồi**: `ApiResponse<PageResponse<OnlineOrderResponse>>`

### 1.2. Chi tiết đơn hàng
- **Endpoint**: `GET /api/online_order/admin/{onlineOrderId}`
- **Phản hồi**: `ApiResponse<OnlineOrderResponse>`

## 2. APIs Khách hàng (Công khai)

### 2.1. Đặt hàng và thanh toán (VNPay)
- **Endpoint**: `POST /api/online_order/createPayment`
- **Mô tả**: Tạo đơn hàng và lấy URL thanh toán VNPay.
- **Tham số**: `returnUrl` (query), `PaymentRequest` (body).

### 2.2. Xử lý phản hồi từ VNPay
- **Endpoint**: `GET /api/online_order/vnpayReturn`
- **Mô tả**: Endpoint để VNPay callback sau khi thanh toán.

### 2.3. Xem danh sách đơn hàng của tôi
- **Endpoint**: `GET /api/online_order/my`
- **Mô tả**: Lấy danh sách các đơn hàng đã đặt của người dùng đang đăng nhập.

---

## 3. Hướng dẫn gọi API từ UI

### 3.1. Gọi API Admin (Yêu cầu JWT Token Admin)
```javascript
const response = await axios.get('/api/online_order/admin', {
  params: { page: 1, customer: 'John' },
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

### 3.2. Gọi API Khách hàng (Yêu cầu JWT Token Customer)
```javascript
const response = await axios.get('/api/online_order/my', {
  headers: { Authorization: `Bearer ${customerToken}` }
});
```
