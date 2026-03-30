# Thiết kế Kiến trúc Firestore Realtime (FNB)

Tài liệu này mô tả cấu trúc Firestore mới, tập trung vào **Reservation** để phục vụ việc theo dõi trạng thái món ăn và tổng tiền tạm tính theo thời gian thực.

## 1. Nguyên tắc cốt lõi
- **Reservation-Centric**: Mọi dữ liệu realtime liên quan đến một lượt ăn của khách hàng sẽ được nhóm dưới `reservationId`.
- **Single Source of Truth**: Document của Reservation trong Firestore sẽ phản ánh trạng thái hiện tại của bàn, bao gồm tổng tiền tạm tính và danh sách món ăn.
- **Loại bỏ Logic cũ**: Xóa bỏ `priorityScore` và collection `orderBills` cũ để đơn giản hóa hệ thống.

---

## 2. Cấu trúc Dữ liệu Firestore

### Collection `activeReservations`
Mỗi document đại diện cho một lượt ăn đang hoạt động.

- **Document ID**: `{reservationId}` (Ví dụ: `123`)
- **Fields**:
  - `tableId`: `Integer`
  - `tableName`: `String` (Ví dụ: "Bàn A1")
  - `customerName`: `String`
  - `status`: `String` (`CHECKEDIN`, `CHECKEDOUT`)
  - `paymentStatus`: `String` (`NOT_REQUESTED`, `REQUESTED`, `COMPLETED`)
  - `paymentMethod`: `String` (`CASH`, `CARD`, `QR_CODE`)
  - `totalAmount`: `Double` (Tổng tiền tạm tính của các món chưa bị hủy)
  - `lastUpdated`: `Timestamp`

### Sub-collection `orderItems` (Nằm trong mỗi reservation)
Danh sách các món ăn đã gọi trong lượt ăn đó.

- **Document ID**: `{orderItemId}` (Ví dụ: `456`)
- **Fields**:
  - `menuItemId`: `Integer`
  - `name`: `String`
  - `price`: `Double` (Giá tại thời điểm gọi món)
  - `quantity`: `Integer`
  - `status`: `String` (`PENDING`, `COOKING`, `READY`, `SERVED`, `CANCELLED`)
  - `orderedAt`: `Timestamp`
  - `note`: `String`

---

## 3. Các Luồng Nghiệp vụ Chính

### A. Đồng bộ Ban đầu (`syncReservationMetadata`)
- **Thời điểm**: Ngay khi khách hàng thực hiện **Check-in** thành công (`ReservationService.checkIn`).
- **Mục tiêu**: Tạo document gốc trong Firestore để Tablet UI và Lễ tân bắt đầu "lắng nghe" (listen).
- **Dữ liệu**: `tableId`, `tableName`, `customerName`, `status`, `totalAmount: 0`.

### B. Gọi món mới (`pushOrderItem`)
- **Thời điểm**: Khi khách hàng xác nhận gửi món từ Tablet.
- **Hành động**: 
  1. Thêm document mới vào sub-collection `orderItems`.
  2. Sử dụng **Firestore Transaction** để cộng dồn giá trị `(price * quantity)` vào trường `totalAmount` của document cha.

### C. Cập nhật trạng thái (`updateOrderItemStatus`)
- **Thời điểm**: Khi Bếp (đánh dấu `COOKING`/`READY`) hoặc Phục vụ (đánh dấu `SERVED`).
- **Hành động**: Cập nhật field `status`. Nếu trạng thái chuyển sang `CANCELLED`, Transaction sẽ thực hiện trừ tiền tương ứng khỏi `totalAmount`.

### D. Kết thúc lượt ăn (`checkoutFlow`)
- **Bước 1 (Tablet - Yêu cầu)**: 
    - FE Tablet kiểm tra: Nếu còn món `PENDING`/`COOKING` -> Hiện Toast yêu cầu chờ hoặc hủy.
    - Nếu sạch món: Gọi API `request-payment`. 
    - Backend cập nhật Firestore `paymentStatus: "REQUESTED"`.
    - **Tablet Lock**: Chuyển sang màn hình chờ thanh toán, vô hiệu hóa nút gọi món.
- **Bước 2 (Admin - Xử lý)**:
    - Lễ tân nhận tín hiệu (bàn nhấp nháy trên sơ đồ).
    - Sau khi thu tiền, Lễ tân xác nhận "Thanh toán" trên Admin UI.
    - Backend cập nhật `status: "CHECKEDOUT"`, `paymentStatus: "COMPLETED"`.
- **Hành động khác**: Sau khi `CHECKEDOUT`, Tablet nhận được signal lắng nghe và tự động hiển thị màn hình cảm ơn/màn hình chờ khách mới.

---

## 4. Luồng vận hành của Bếp (Chef UI)

Để đảm bảo bếp hoạt động trơn tru và realtime, FE của Bếp sẽ áp dụng cơ chế: **"Listen từ Firestore - Update qua API"**.

### A. Hiển thị danh sách món ăn (Real-time List)
- **Cơ chế**: Sử dụng **Collection Group Query** để lắng nghe tất cả các sub-collection tên là `orderItems` trên toàn bộ hệ thống.
- **Query Filter**: `where("status", "in", ["PENDING", "COOKING"])`.
- **Query Sort**: `orderBy("orderedAt", "asc")` (Đảm bảo hàng đợi FIFO).
- **Dữ liệu bổ trợ**: Mỗi document món ăn hiện đã có sẵn `reservationId` và `tableName` bên trong để Bếp có thể nhóm món theo bàn mà không cần query thêm.

### B. Hành động cập nhật (Action Update)
- **Luồng**: Bếp bấm "Nấu" hoặc "Xong" trên UI -> Gọi **Fetch API** về Spring Boot.
- **Lý do**: Để Spring Boot cập nhật MySQL, tính toán EMA (thời gian nấu trung bình), và giải phóng trạng thái đầu bếp. Sau đó Backend sẽ tự cập nhật lại Firestore để đồng bộ cho tất cả các bên (Tablet khách hàng, Lễ tân).

---

## 5. Chiến lược Filter & Grouping (Dành cho FE Bếp)

FE có thể linh hoạt chuyển đổi giữa các chế độ hiển thị:
1.  **Chế độ Hàng đợi (Queue View)**: Hiển thị danh sách phẳng, sắp xếp theo `orderedAt`. Giúp bếp biết món nào vào trước để làm trước.
2.  **Chế độ Theo Bàn (Table View)**: Group (nhóm) các món ăn theo `tableName` hoặc `reservationId`. Giúp bếp ra món đồng loạt theo từng bàn, tối ưu trải nghiệm phục vụ.
3.  **Filter theo Trạng thái**: Lọc riêng các món đang `PENDING` để phân công hoặc các món đang `COOKING` để theo dõi tiến độ.

---

## 6. Chiến lược Đăng ký (Subscribe) của UI

- **Tablet UI**: Lắng nghe `activeReservations/{reservationId}` để xem tổng tiền và lắng nghe sub-collection `orderItems` để hiển thị danh sách trạng thái từng món.
- **Lễ tân UI**: Khi click xem chi tiết bàn, cũng dùng chung cơ chế lắng nghe của Tablet.
- **Bếp UI**: Sử dụng Collection Group để xem toàn bộ món ăn đang chờ/đang nấu trên tất cả các bàn.

---

## 7. Kế hoạch Refactor `FirestoreService.java` (Đã hoàn thành)

1.  **Hàm `pushOrderItem`**: Lưu vào `activeReservations/{resId}/orderItems/{itemId}` kèm theo `reservationId` và `tableName` bên trong item.
2.  **Hàm `syncReservationMetadata`**: Khởi tạo session khi check-in.
3.  **Hàm `updateOrderItemStatus`**: Cập nhật trạng thái món (PENDING -> COOKING -> DONE).
4.  **Hàm `removeOrderItem`**: Xóa món và tự động trừ tiền trong Firestore Transaction.
5.  **Xóa logic cũ**: Đã gỡ bỏ `priorityScore` và các scheduler liên quan.

---

## 10. Danh sách công việc cho Frontend (FE Tasks)

Dưới đây là các đầu việc cụ thể để team FE triển khai dựa trên kiến trúc Firestore mới:

### A. Tablet UI (Giao diện khách hàng)
1.  **Gửi món ăn (Send Order)**: Thay vì chỉ popup thêm vào giỏ, khi khách nhấn "Xác nhận gọi món", gọi API `POST /api/order_session/{sessionId}/orderitems`.
2.  **Lắng nghe trạng thái món (Real-time List)**: 
    - Dùng `onSnapshot` lắng nghe sub-collection `activeReservations/{resId}/orderItems`.
    - Hiển thị danh sách món ăn kèm trạng thái (`PENDING`, `COOKING`, `SERVED`).
3.  **Theo dõi tổng tiền**: Lắng nghe field `totalAmount` tại document cha để cập nhật số tiền khách cần trả realtime.
4.  **Luồng Thanh toán**:
    - Kiểm tra nếu còn món chưa `SERVED` (trừ món đã hủy) -> Hiện Toast cảnh báo.
    - Gọi API `POST /api/order_session/{sessionId}/request-payment`.
    - Khi `paymentStatus == "REQUESTED"` -> Hiện màn hình "Đang chờ Lễ tân" (Lock UI).

### B. Kitchen UI (Giao diện Bếp)
1.  **Lấy danh sách món (Collection Group)**:
    - Query `collectionGroup("orderItems")` với điều kiện `status` thuộc `PENDING`, `COOKING`.
    - `orderBy("orderedAt", "asc")` để ưu tiên món vào trước.
2.  **Nhóm theo bàn (Grouping)**: Hiển thị giao diện dạng thẻ hoặc hàng dọc, nhóm các món có cùng `tableName`.
3.  **Cập nhật trạng thái**: Khi Chef bấm "Bắt đầu nấu" hoặc "Xong", gọi Fetch API tương ứng về Backend (MySQL).

### C. Receptionist UI (Giao diện Lễ tân)
1.  **Theo dõi sơ đồ bàn**: Lắng nghe collection `activeReservations`.
2.  **Xem chi tiết lượt ăn**: 
    - **Điều kiện (Validation)**: Chỉ cho phép click xem món khi bàn có `status == "CHECKEDIN"` trên Firestore. Nếu bàn trống hoặc đang dọn, nút xem chi tiết sẽ bị vô hiệu hóa (disabled).
    - **Hiển thị**: Danh sách món ăn thực tế lấy từ sub-collection `orderItems` trên Firestore (Real-time).
    - **Tổng tiền**: Hiển thị **Tổng hóa đơn tạm tính** (lấy từ field `totalAmount` của document cha).
3.  **Thông báo & Phản hồi Thanh toán**: 
    - Nếu bàn có `paymentStatus == "REQUESTED"` -> Highlight bàn đó (nhấp nháy hoặc hiện icon thông báo).
    - Hiển thị phương thức thanh toán khách đã chọn (Tiền mặt / VNPay / Thẻ).
4.  **Hành động Thanh toán (Thực hiện bởi Lễ tân)**: 
    - **Thanh toán Tiền mặt**: Gọi API `POST /api/order_session/{sessionId}` để kết thúc hóa đơn.
    - **Thanh toán Online (VNPay)**: Lễ tân xác nhận -> Gọi API `POST /api/order_session/createPayment/{sessionId}` để lấy URL thanh toán/mã QR VNPay cho khách.
    - Sau khi hoàn tất, Backend sẽ tự động cập nhật `status: "CHECKEDOUT"` và dọn dẹp Firestore.

