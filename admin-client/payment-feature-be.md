# Hướng dẫn Tích hợp Thanh toán VNPay (Luồng Tablet/Dine-in)

Dưới đây là tổng hợp các thay đổi và hướng dẫn dành cho Frontend (FE) để tích hợp luồng thanh toán mới, đảm bảo tính an toàn và tự động reset màn hình Tablet.

## 1. Quy trình tổng quát (Flow)

1. **FE** gọi API lấy link thanh toán VNPay.
2. **FE** chuyển hướng người dùng sang trang thanh toán của VNPay.
3. **VNPay** xử lý và gửi kết quả về qua 2 kênh:
    - **IPN (Webhook)**: VNPay gọi ngầm đến Backend (BE). BE sẽ chốt đơn, tạo Bill và **xóa dữ liệu trên Firestore**.
    - **Return URL**: VNPay chuyển hướng người dùng quay lại FE. FE gọi BE để xác nhận và hiển thị kết quả cho khách.
4. **Tablet**: Khi thấy dữ liệu trên Firestore bị xóa, Tablet tự động quay về màn hình Check-in.

---

## 2. Chi tiết API dành cho FE

### Step 1: Lấy URL thanh toán VNPay
- **Endpoint**: `POST /api/order_session/createPayment/{sessionId}?returnUrl=<FE_URL_Return>`
- **Body**: `PaymentRequest` (Có thể để trống `{}` nếu không dùng mã giảm giá).
- **Kết quả**: Trả về String là URL của VNPay.
- **Hành động FE**: `window.location.href = response.data;`

### Step 2: Xử lý kết quả tại Return URL
Khi khách hàng quay lại trang `returnUrl` của FE, URL sẽ có rất nhiều params (ví dụ: `.../?vnp_Amount=...&vnp_ResponseCode=00...`).
- **FE** lấy **toàn bộ** query params đó và gửi cho BE:
- **Endpoint**: `GET /api/order_session/vnpayReturn`
- **Params**: Forward toàn bộ query params nhận được từ VNPay.
- **Hành động FE**:
    - Nếu BE trả về `BillResponse`: Hiển thị màn hình "Thanh toán thành công", in hóa đơn (nếu cần).
    - Nếu BE báo lỗi (ví dụ `PAYMENT_FAILED`): Hiển thị Toast thông báo lỗi để khách thử lại hoặc chọn phương thức khác. 
    - **Lưu ý**: Đơn hàng tại bàn sẽ **KHÔNG** bị xóa nếu thanh toán lỗi, khách có thể gọi lại API tạo link thanh toán để thử lại.

---

## 3. Cơ chế Tự động Reset Tablet (Firestore)

Đây là thay đổi quan trọng để Tablet tự động quay về màn hình chào khách:

- **Logic Backend**: Khi nhận được tín hiệu thành công (từ IPN hoặc Return URL), BE sẽ thực hiện:
    1. Tạo `Bill` vào Database.
    2. Gọi `firestoreService.deleteReservation(reservationId)`.
- **Hành động FE (Tablet)**:
    - Tablet của bạn hiện đang lắng nghe (listen/subscribe) vào document của `activeReservations` trên Firestore.
    - Khi document này bị xóa (`onSnapshot` nhận sự kiện `type: 'removed'`), Tablet cần thực hiện logic:
        - Xóa giỏ hàng local (nếu có).
        - Chuyển hướng về `/check-in` hoặc màn hình mặc định.

---
## 4. Xử lý IPN (Dành cho môi trường Dev)

Để Test luồng chốt đơn ngầm (IPN) tại local:
1. Sử dụng **ngrok**: `ngrok http 8080`.
2. Cấu hình IPN URL trên Merchant Admin của VNPay: `https://<ngrok-url>/api/order_session/vnpayIpn`.
3. Khi bạn thanh toán sandbox thành công, VNPay sẽ gọi về endpoint này. BE sẽ tự động tạo Bill và dọn dẹp Firestore ngay cả khi bạn đóng trình duyệt ở trang thanh toán.
---

## 4. Trick Lỏ: Xử lý Demo Local không có IPN

Do môi trường local không có IPN URL để VNPay gọi ngầm, ta có thể sử dụng "trick" so khớp ngay tại FE/BE để đảm bảo demo mượt mà:

1. **Lưu Context (BE)**: Backend sẽ lưu tạm `paymentUrl` (với đầy đủ các tham số như TxnRef, Amount...) vào bộ nhớ (Cache) ngay khi link thanh toán được tạo.
2. **So khớp tại Return**: Khi trình duyệt được redirect về `returnUrl`, BE sẽ lấy các tham số từ URL đó và so sánh với `paymentUrl` đã lưu để đảm bảo tính hợp lệ (kiểm tra mã giao dịch, số tiền...).
3. **Thao tác Demo (Tablet)**: 
   - Nếu khách thanh toán trên điện thoại cá nhân, hãy copy URL kết quả (Return URL) trên điện thoại và gửi cho Tablet (hoặc đơn giản là dùng Tablet truy cập link đó).
   - Khi Tablet (hoặc trình duyệt laptop) truy cập `returnUrl`, API `/api/order_session/vnpayReturn` sẽ khớp dữ liệu và reset Tablet ngay lập tức thông qua Firestore.

---

## 5. Danh sách Endpoint mới/cập nhật

| Chức năng | Method | Endpoint | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| Tạo Payment URL | `POST` | `/api/order_session/createPayment/{sessionId}` | `CUSTOMER` / `ADMIN` |
| Xác nhận thanh toán (Return) | `GET` | `/api/order_session/vnpayReturn` | `CUSTOMER` / `ADMIN` |
| Hook xác nhận ngầm (IPN) | `GET` | `/api/order_session/vnpayIpn` | `PUBLIC` |

> [!NOTE]
> Tuyệt đối không xóa đơn hàng `DINE_IN` khi thanh toán thất bại. Chỉ báo lỗi để người dùng có thể thực hiện lại thao tác thanh toán.
