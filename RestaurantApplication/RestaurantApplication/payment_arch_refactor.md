# Refactor Payment Handling Architecture

Hiện tại, logic xử lý thanh toán (đặc biệt là VNPay) đang bị trộn lẫn trong `OnlineOrderService`. Điều này vi phạm nguyên tắc SOLID (SRP và OCP), gây khó khăn khi bạn muốn thêm các phương thức thanh toán mới như Momo, ZaloPay... và tạo ra sự phụ thuộc chéo giữa các service.

Tôi đề xuất tái cấu trúc theo mô hình **Strategy Pattern** phối hợp với một **Payment Manager** để quản lý việc thanh toán một cách tập trung và dễ mở rộng.

## User Review Required

> [!IMPORTANT]
> Việc tái cấu trúc này sẽ thay đổi cách `OrderSessionController` gọi xử lý payment. Thay vì gọi trực tiếp `OnlineOrderService.handleVnpayReturn`, nó sẽ gọi qua một `PaymentManagerService` chung.

## Proposed Changes

### 1. Interface và DTO cho Payment

#### [NEW] [PaymentGateway.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/payment/PaymentGateway.java)
Định nghĩa contract chung cho bất kỳ nhà cung cấp thanh toán nào (VNPay, Momo...).
- `createPaymentUrl(Integer orderId, Long amount, String returnUrl)`
- `boolean verifySignature(Map<String, String> params)`
- `String getOrderId(Map<String, String> params)`
- `boolean isSuccess(Map<String, String> params)`

#### [NEW] [PaymentType.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/constant/PaymentType.java)
Enum định nghĩa các phương thức thanh toán (VNPAY, MOMO...).

### 2. VNPay Implementation

#### [NEW] [VNPayGateway.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/payment/VNPayGateway.java)
Cài đặt `PaymentGateway` dành riêng cho VNPay. Toàn bộ logic kiểm tra chữ ký, mã phản hồi VNPay sẽ nằm ở đây.

### 3. Payment Orchestration (Điều phối)

#### [NEW] [PaymentManagerService.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/payment/PaymentManagerService.java)
Service trung tâm để Controllers gọi vào:
- Chọn đúng `PaymentGateway` dựa trên `PaymentType`.
- Xử lý logic chung cho cả "Return URL" và "IPN" (Tìm order, xác thực chữ ký).
- Gọi qua `PaymentService` hiện tại để chốt đơn (tạo bill, cập nhật trạng thái bàn, xóa giỏ hàng).

### 4. Refactoring Services hiện tại

#### [MODIFY] [OnlineOrderService.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/OnlineOrderService.java)
- Loại bỏ các hàm `handleVnpayReturn`, `handleVnpayIpn`, `verifyVnpaySignature`.
- Cập nhật `createPaymentUrl` để sử dụng `PaymentManagerService`.

#### [MODIFY] [OrderSessionController.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/OrderSessionController.java)
- Cập nhật `/vnpayReturn` và `/vnpayIpn` để gọi qua `PaymentManagerService`.

## Open Questions

> [!NOTE]
> Bạn có muốn gộp tất cả các Callback/IPN về một `PaymentController` duy nhất không? Hay vẫn để ở `OrderSessionController` và `OnlineOrderController`? 
> **Gợi ý của tôi:** Nên có một `PaymentController` riêng để xử lý tất cả các luồng Callback thanh toán, giúp code gọn gàng hơn.

## Verification Plan

### Automated Tests
- Mock `PaymentGateway` để test logic xác thực trong `PaymentManagerService`.
- Kiểm tra `VNPayGateway` tạo URL đúng định dạng và verify chữ ký chuẩn.

### Manual Verification
- Test luồng "Ăn tại chỗ" (Dine-in) qua VNPay Sandbox.
- Test luồng "Đặt trực tuyến" (Online order) qua VNPay Sandbox.
