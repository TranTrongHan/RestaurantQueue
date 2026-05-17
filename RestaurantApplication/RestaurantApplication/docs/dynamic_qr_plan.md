# Kế Hoạch Triển Khai: Gọi Món Nhanh Qua Máy Tính Bảng Cố Định Tại Bàn (Haidilao-style)

Phương án này sử dụng mô hình **Máy tính bảng cố định tại bàn (Dedicated Restaurant Tablet)** chạy ứng dụng Khách (`restaurant-client`). Thiết bị tự động nhận diện và đồng bộ phiên ăn của bàn theo thời gian thực nhờ cơ chế kết hợp **Firestore Sync và API Token Exchange**.

---

## Nghiệp Vụ Vận Hành (User & Staff Journey)

1.  **Mở bàn**: Khách vãng lai ngồi vào Bàn số 5 trống. Máy tính bảng tại bàn đang ở trạng thái chờ Standby: *"Chào mừng quý khách! Xin vui lòng đợi nhân viên mở bàn để bắt đầu gọi món."*
2.  **Nhân viên kích hoạt**: Nhân viên bấm **"Mở Bàn Khách Vãng Lai"** trên [admin-client](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client).
3.  **Tự động đồng bộ**: 
    *   Hệ thống Backend chuyển trạng thái bàn thành `OCCUPIED` và đẩy thông tin reservation lên Firestore.
    *   Máy tính bảng tại Bàn 5 lập tức phát hiện thay đổi trạng thái từ Firestore, tự động gọi API lấy `sessionToken` của phiên mới.
    *   Máy tự động trao đổi `sessionToken` lấy `customerJwt` bảo mật và chuyển sang giao diện Thực Đơn (Menu) tức thì mà không cần bất kỳ sự can thiệp thủ công nào của khách.
4.  **Tự động reset khi thanh toán**: Khách thanh toán hóa đơn thành công -> Thu ngân đóng bàn -> Máy tính bảng tự động xóa sạch token phiên cũ và quay trở lại màn hình chờ Standby ban đầu.

---

## Backend APIs Status (Đã kiểm tra & Sẵn sàng)

Chúng tôi đã hoàn thành xây dựng và kiểm thử thành công toàn bộ các API Backend cần thiết cho luồng này trong Spring Boot. Dưới đây là trạng thái và phân quyền bảo mật của các API:

| STT | Phương thức | Endpoint | Phân quyền bảo mật (Spring Security) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/admin/reservation/quick-checkin?tableId=X` | `@PreAuthorize("hasRole('ADMIN')")` | **[Completed]** |
| 2 | `GET` | `/api/order_session/active-session?tableId=X` | `permitAll()` (Công khai để Tablet chưa đăng nhập có thể gọi) | **[Completed]** |
| 3 | `GET` | `/api/order_session/join?token=uuid` | `permitAll()` (Công khai để trao đổi token bí mật lấy `customerJwt`) | **[Completed]** |
| 4 | `GET` | `/api/admin/tables` | `@PreAuthorize("hasRole('ADMIN')")` | **[Completed]** |

---

## Frontend Implementation Checklist (Các bước cần triển khai ở FE)

### 1. Admin Dashboard (`admin-client`)

*   **Bước 1.1: Khai báo API Endpoint**
    *   Thêm `admin_tables`, `admin_quick_checkin`, và `admin_active_session` vào file [Apis.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/configs/Apis.js) *(Đã hoàn thành!)*.
*   **Bước 1.2: Thêm Trình chuyển đổi View Mode (Tab Switcher)**
    *   Tại [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx), bổ sung một Header Tab để nhân viên chuyển đổi giữa `"Danh sách đặt bàn"` và `"Sơ đồ bàn / Khách vãng lai"`.
*   **Bước 1.3: Hiển thị Sơ đồ Bàn trực quan (Table Grid)**
    *   Khi chế độ Sơ đồ bàn kích hoạt, gọi API `GET /api/admin/tables` để lấy danh sách bàn và hiển thị dưới dạng Grid đáp ứng (Responsive Grid).
    *   Tự động đồng bộ thời gian thực trạng thái bàn bằng cách liên kết danh sách bàn với dữ liệu Firestore `realtimeData`.
*   **Bước 1.4: Triển khai các Nút Hành Động trên mỗi thẻ Bàn**
    *   **Bàn trống (`AVAILABLE` - Màu xanh)**: Hiển thị nút **"Mở Bàn Khách Vãng Lai"**. Khi bấm: Gọi API `POST /api/admin/reservation/quick-checkin?tableId=X`.
    *   **Bàn đang sử dụng (`OCCUPIED` - Màu đỏ)**: 
        *   Hiển thị nút **"Xem mã QR"** (Mở Modal QR dự phòng để quét bằng điện thoại khách nếu cần).
        *   Hiển thị nút **"Xem chi tiết ăn uống"** (Chuyển tiếp đến trang quản lý và thanh toán bàn `/reservations/${reservationId}`).
    *   **Bàn đặt trước (`BOOKED` - Màu vàng)**: Hiển thị nút check-in tiêu chuẩn.
*   **Bước 1.5: Giao diện Modal hiển thị Mã QR Động**
    *   Sử dụng thư viện `qrcode.react` để vẽ mã QR với đường dẫn: `http://[IP_DEV]:5173/menu?token=[sessionToken]`.
    *   Thêm nút **"Mở giả lập Tablet"** để hỗ trợ developer test mở thẳng tab mới cho nhanh.

---

### 2. Customer Application (`restaurant-client` - Chạy trên Tablet cố định)

*   **Bước 2.1: Nhận diện chế độ Tablet (Tablet Mode Device Setup)**
    *   iPad cố định tại bàn (Ví dụ Bàn 5) sẽ chạy ứng dụng Khách và được gán sẵn cấu hình định danh `tableId = 5` (lưu tại `localStorage` hoặc qua tham số URL setup ban đầu như `/menu?tableMode=true&tableId=5`).
*   **Bước 2.2: Thiết kế Giao diện Trạng thái Chờ (Standby / Welcome Screen)**
    *   Khi ứng dụng kiểm tra thấy `tableMode = true` và chưa có phiên hoạt động (không có `customerJwt` hợp lệ trong `localStorage`):
        *   Hiển thị giao diện màn hình chờ Standby tuyệt đẹp với logo nhà hàng, hình nền động và lời nhắn: *"Chào mừng quý khách! Vui lòng đợi phục vụ mở bàn để bắt đầu gọi món."*
*   **Bước 2.3: Viết Firestore Listener tự động mở thực đơn (Auto-Activation)**
    *   Thiết lập một Listener lắng nghe Firestore `activeReservations` theo thời gian thực, lọc theo `tableId = 5`.
    *   Ngay khi phát hiện có bản ghi Reservation mới xuất hiện (Nhân viên vừa bấm "Mở bàn nhanh"):
        1.  Gọi API công khai: `GET /api/order_session/active-session?tableId=5` để lấy `sessionToken` bí mật của phiên mới.
        2.  Gọi API công khai tiếp theo: `GET /api/order_session/join?token=[sessionToken]` để nhận `customerJwt` bảo mật.
        3.  Lưu `customerJwt` và `sessionId` vào `localStorage`, cài đặt Auth Header cho các request Axios tiếp theo.
        4.  Tự động chuyển đổi giao diện (Fade transition) từ màn hình chờ Standby sang **Thực Đơn Gọi Món (Menu)** để khách bắt đầu chạm gọi món!
*   **Bước 2.4: Tự động khóa và Reset màn hình khi Thanh toán (Auto-Lock & Reset)**
    *   Khi khách hàng thanh toán xong, quầy thu ngân đóng phiên ăn -> Bản ghi `activeReservations` trên Firestore bị xóa -> Bàn chuyển về `AVAILABLE`.
    *   Firestore Listener trên Tablet phát hiện bản ghi đã bị xóa:
        1.  Tự động xóa sạch `customerJwt`, `sessionId` và thông tin giỏ hàng hiện tại trong `localStorage`.
        2.  Tự động chuyển màn hình Menu quay trở lại màn hình chờ Standby ban đầu một cách hoàn toàn tự động.

---

## Verification Plan

### Kiểm thử Tự động & Thủ công (Mô hình Tablet cố định)
1.  **Kịch bản 1: Mở phiên ăn và Tablet tự động kích hoạt**
    *   Cấu hình tablet ảo bằng cách mở trình duyệt ẩn danh tại địa chỉ `http://localhost:5173/menu?tableMode=true&tableId=5` (Màn hình hiển thị trạng thái chờ Standby: *"Vui lòng đợi nhân viên mở bàn"*).
    *   Tại màn hình `admin-client` (`http://localhost:5174/reservations`), chọn Bàn 5 đang trống và bấm "Mở Bàn Khách Vãng Lai".
    *   Xác minh trên màn hình tablet ảo tự động chuyển sang trang gọi món `/menu` với thực đơn phong phú mà không cần bất kỳ tương tác thủ công nào của khách.
    *   Xác minh trong `localStorage` của tablet đã lưu trữ thành công `customerJwt` tương ứng với tài khoản Shadow Guest ẩn danh.
2.  **Kịch bản 2: Gọi món trực tiếp trên Tablet**
    *   Tại màn hình tablet, thực hiện chọn 3 món ăn ngon và bấm "Đặt món".
    *   Xác minh các món ăn được gửi thành công lên Backend, đồng thời đẩy lập tức lên màn hình Bếp (`KitchenOrdersPage`) trong tích tắc.
3.  **Kịch bản 3: Tự động khóa và khôi phục khi thanh toán**
    *   Tại màn hình `admin-client`, thực hiện xử lý thanh toán cho Bàn 5.
    *   Xác minh khi thanh toán thành công, màn hình tablet ảo tự động xóa sạch token đăng nhập và trở về màn hình chờ Standby ban đầu một cách hoàn hảo.
