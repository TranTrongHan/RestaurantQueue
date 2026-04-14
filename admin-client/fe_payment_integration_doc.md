# Hướng dẫn tích hợp luồng Thanh toán & Voucher (Cho Frontend)

Tài liệu này tổng hợp các API và logic cần thiết để tích hợp luồng thanh toán VNPay có áp dụng Voucher cho cả hai ứng dụng: **Admin Dashboard** (Thanh toán tại quầy) và **Customer App** (Thanh toán online).

---

## 1. Luồng Dine-In (Thanh toán tại bàn - Admin thực hiện)

Dùng cho ứng dụng Admin trên Tablet hoặc máy tính khi bàn yêu cầu thanh toán.

### Bước 1: Lấy danh sách Voucher của khách hàng
Khi chọn thanh toán cho một khách hàng, FE cần lấy danh sách voucher trong ví của khách đó để hiển thị lựa chọn.
- **Endpoint:** `GET /api/admin/customers/{userId}/vouchers`
- **Response:** Danh sách `UserVoucherResponse` chứa thông tin voucher của khách.

### Bước 2: Kiểm tra Voucher (Preview)
Admin có thể nhập mã voucher thủ công hoặc chọn từ danh sách. Trước khi thanh toán, FE gọi API này để lấy số tiền giảm giá và tổng tiền thực tế.
- **Endpoint:** `POST /api/order_session/check-voucher/{sessionId}?voucherCode=XXX`
- **Response:**
    ```json
    {
      "subTotal": 1000000,
      "discount": 200000,
      "finalTotal": 800000
    }
    ```

### Bước 3: Tạo lệnh thanh toán VNPay
Admin nhấn "Thanh toán VNPay", hệ thống sẽ tạo link thanh toán dựa trên số tiền đã trừ Voucher.
- **Endpoint:** `POST /api/order_session/createPayment/{sessionId}?returnUrl=FE_RETURN_URL`
- **Payload:**
    ```json
    {
      "promotionName": "VOUCHER_CODE",
      "paymentType": "VNPAY"
    }
    ```
- **Lưu ý:** Backend sẽ tự động đính kèm `&promotionName=VOUCHER_CODE` vào `FE_RETURN_URL` sau khi thanh toán thành công.

### Bước 4: Xử lý kết quả trả về (Return)
Sau khi thanh toán xong, VNPay redirect về `FE_RETURN_URL`. FE lấy toàn bộ query params (bao gồm cả `promotionName`) và gửi về Backend.
- **Endpoint:** `GET /api/order_session/vnpayReturn?params...`
- **Logic:** Gọi Backend để nhận về object `BillResponse`. Tại bước này Backend mới xác nhận thanh toán thành công và trừ Voucher.

---

## 2. Luồng Online Order (Thanh toán đơn hàng App - Khách thực hiện)

Dùng cho khách hàng đặt món giao tận nơi hoặc mang về.

### Bước 1: Lấy kho Voucher cá nhân
- **Endpoint:** `GET /api/customer/vouchers/my-wallet`

### Bước 2: Tạo lệnh thanh toán
- **Endpoint:** `POST /api/online_order/createPayment?returnUrl=FE_RETURN_URL`
- **Payload:**
    ```json
    {
      "promotionName": "VOUCHER_CODE",
      "paymentType": "VNPAY"
    }
    ```

### Bước 3: Xử lý kết quả trả về (Return)
- **Endpoint:** `GET /api/online_order/vnpayReturn?params...`
- **Lưu ý:** Tương tự như Dine-in, FE cần truyền toàn bộ query params từ URL về cho Backend, bao gồm các tham số VNPay và `promotionName`.

---

## 3. Các lưu ý quan trọng (Dành cho FE)

> [!IMPORTANT]
> - **Tham số promotionName**: Backend dựa vào tham số này trong URL Return để biết cần áp dụng voucher nào cho hóa đơn cuối cùng. FE **bắt buộc** phải giữ tham số này khi gọi API `vnpayReturn`.
> - **Luồng xử lý lỗi**: Nếu `createPayment` hoặc `check-voucher` trả về lỗi (Voucher hết hạn, chưa đủ giá trị đơn hàng tối thiểu), Backend sẽ trả về mã lỗi và message. FE nên hiển thị toast thông báo cho người dùng.
> - **Giao diện**: Luôn hiển thị rõ 3 mốc tiền: Tổng tiền món ăn (Subtotal) -> Giảm giá (Discount) -> Số tiền cần thanh toán (Final Total).

---

## 4. Cấu trúc BillResponse (Dùng chung)
Dữ liệu này sẽ được trả về cuối cùng để FE hiển thị màn hình "Thanh toán thành công":
| Trường | Mô tả |
| :--- | :--- |
| `subTotal` | Tổng tiền gốc của các món ăn. |
| `discountAmount` | Số tiền được giảm. |
| `totalAmount` | Số tiền thực tế khách đã trả. |
| `paymentTime` | Thời gian giao dịch thành công. |
