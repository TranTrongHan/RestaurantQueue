# Hướng dẫn Tích hợp Yêu cầu Thanh toán & Khóa bàn (Tablet)

Tài liệu này tổng hợp các bước Frontend (Tablet) cần thực hiện để tích hợp luồng yêu cầu thanh toán và cơ chế khóa bàn tự động.

## 1. Luồng nghiệp vụ tại Tablet

### Bước 1: Kiểm tra điều kiện trước khi yêu cầu
Trước khi cho phép khách hàng nhấn nút "Thanh toán" hoặc "Yêu cầu thanh toán":
- **FE** cần duyệt danh sách `orderItems` hiện tại (từ Firestore hoặc API).
- Nếu có bất kỳ món nào ở trạng thái `PENDING` hoặc `COOKING`:
    - Hiển thị Toast thông báo: *"Vui lòng chờ các món đang nấu hoàn tất trước khi yêu cầu thanh toán!"*
    - Ngăn chặn không cho gọi API.

### Bước 2: Hiển thị Confirm Box
- Khi khách nhấn nút yêu cầu thanh toán, FE phải hiển thị một hộp thoại xác nhận (Confirm Box).
- Nội dung: *"Bạn có chắc chắn muốn yêu cầu thanh toán? Sau khi yêu cầu, bạn sẽ không thể đặt thêm món mới."*

### Bước 3: Gọi API Yêu cầu thanh toán
- **Endpoint**: `POST /api/order_session/requestPayment/{sessionId}`
- **Hành động**: Sau khi khách xác nhận ở Bước 2.

---

## 2. Xử lý Trạng thái Khóa bàn (Realtime)

Tablet cần lắng nghe thay đổi trạng thái của Reservation trên Firestore (`activeReservations/{resId}`).

### Khi trạng thái là `REQUEST_PAYMENT`:
1. **Giao diện**: Hiển thị một lớp phủ (Overlay) hoặc thông báo cố định: *"Bàn đang trong quá trình thanh toán. Vui lòng liên hệ nhân viên nếu bạn muốn thay đổi."*
2. **Mục đích**: Tránh trường hợp khách cố tình gọi thêm món khi nhân viên đang chuẩn bị hóa đơn.

---

## 3. Xử lý lỗi từ Backend

Nếu vì lý do nào đó khách vẫn gửi được yêu cầu đặt món (ví dụ: qua API trực tiếp hoặc bug UI), Backend sẽ trả về lỗi:

- **ErrorCode**: `3005`
- **Message**: *"Table is locked for payment. No more orders allowed."*
- **Hành động FE**: Hiển thị thông báo lỗi và yêu cầu trang tải lại để cập nhật trạng thái mới nhất.

---

## 4. Hoàn tất thanh toán (Reset Tablet)

Logic này tương tự như trong tài liệu `payment.md`:
- Khi thanh toán thành công (Tiền mặt hoặc Chuyển khoản/VNPay), Backend sẽ xóa document trên Firestore.
- **FE (Tablet)**: Nhận sự kiện `type: 'removed'` -> Xóa trạng thái đơn hàng local và chuyển về màn hình `Check-in`.

---

## Tóm tắt API & Status

| Chức năng | Method | Endpoint | Status Firestore |
| :--- | :--- | :--- | :--- |
| Yêu cầu thanh toán | `POST` | `/api/order_session/requestPayment/{sessionId}` | `REQUEST_PAYMENT` |
| Đặt món (Bị chặn nếu locked) | `POST` | `/api/order_session/order/{sessionId}` | Lỗi `3005` nếu đang locked |
