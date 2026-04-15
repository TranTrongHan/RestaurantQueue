# Kế hoạch Tái cấu trúc Luồng Thanh toán VNPay (Chống Mất Giỏ Hàng & Dọn Rác DB)

## Vấn đề gặp phải
Như bạn đã phân tích ở log, khi bạn bấm "Thanh Toán", Backend thực chất đã **thành công** tạo ra Payment URL của VNPay và trả về mã 200 HTTP, đồng thời **dọn sạch giỏ hàng (OnlineCart)** và tạo ra các record `Order`, `OnlineOrder` tương ứng.
Tuy nhiên, khi Frontend Redirect sang đường dẫn của VNPay, VNPay lại thông báo lỗi "Website không xác thực" (lỗi do sandbox hết hạn). Việc này dẫn tới:
- Người dùng **chưa thanh toán được** nhưng **Giỏ hàng đã bị xóa trống**.
- Database bị kẹt một `Order` và `OnlineOrder` rác ở trạng thái *Chưa thanh toán (Pending Payment)*.
- Người dùng không có cách nào bấm "Thanh toán lại" do giỏ hàng đã mất.

> [!WARNING]
> Đây là một Anti-pattern trong luồng e-commerce. Giỏ hàng chỉ nên bị xóa bỏ **SAU KHI** khách hàng thực sự thanh toán thành công, hoặc đơn hàng đã được chốt cứng (đối với thanh toán Cash On Delivery).

## Proposed Changes

Chúng ta sẽ sửa đổi lại luồng đi của hệ thống để Giỏ hàng chỉ bị reset khi Endpoint `/vnpayReturn` báo về mã `00` (Giao dịch thành công).

---

### Các Components cần sửa

#### 1. `OrderManagementService.java`
* **Mục tiêu:** Quá trình chuyển items từ Giỏ hàng sang Hoá đơn không được xoá mất Giỏ hàng.
* **Thay đổi:** 
  - Trong hàm `createOrderItemsFromCartForOnlineOrderAndGetSubTotal(...)`, **XÓA BỎ** đoạn code `onlineCartList.forEach(cartRepository::delete);`.
  - Giữ lại toàn bộ hàm tính toán Subtotal và map sang `OrderItem`.

#### 2. `OnlineOrderService.java`
* **Mục tiêu:** Cập nhật hàm `handleVnpayReturn` để xử lý dọn dẹp Giỏ Hàng rác.
* **Thay đổi:**
  - Trong luồng **Thành công** (`responseCode == "00"`): 
    - Gọi logic xóa OnlineCart của user đang Active để reset lại Giỏ Hàng. (Thêm dependency `OnlineCartRepository` hoặc gọi `cartService.clearCart()`).
  - Trong luồng **Thất bại** (`responseCode != "00"`): 
    - Tiến hành xóa `Order` hiện tại (bạn đã có sẵn `orderRepository.delete(order)`).
    - Mình sẽ thêm logic xóa cả `OnlineOrder` phụ thuộc để không làm rác Database.
    - Giỏ hàng **vẫn tự động được giữ nguyên** do không có bước xóa nào được gọi. Người dùng back lại trang chủ là có thể test thanh toán lại ngay bằng phương thức khác.

## Open Questions

1. Việc giữ lại Order Pending chưa thanh toán bao lâu thì bị Timeout dọn dẹp? Hiện tại nếu người dùng tắc tab trên VNPay, Đơn hàng pending có được cron xoá bỏ không hay bạn muốn mình setup cho bạn `@Scheduled` để clear? Đồ án có tính điểm phần dọn rác đơn hàng tồn đọng quá hạn không?
2. Trước mắt mình sẽ sửa luôn lỗi luồng xử lý giỏ hàng ngay lập tức để bạn test lại.

## User Review Required

Bạn có đồng ý với logic kinh điển của E-commerce này không (Không Xóa giỏ hàng cho đến lúc nhận 00 từ Payment Gateway)? Nếu đồng ý, mình sẽ triển khai sửa đổi nhanh chóng các Service!
