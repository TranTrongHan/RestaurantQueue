# Kế hoạch triển khai: Gọi Món Qua Máy Tính Bảng Cố Định Tại Bàn (Haidilao-style Tablet Ordering - Tối Ưu Nhất)

Kế hoạch này chi tiết hóa việc tích hợp luồng nghiệp vụ **Máy tính bảng cố định tại bàn (Dedicated Restaurant Tablet)** chạy ứng dụng Khách (`restaurant-client`). Giao diện Tablet sẽ tự động nhận diện và đồng bộ phiên ăn của bàn theo thời gian thực nhờ cơ chế kết hợp **Firestore Sync và API Token Exchange**.

Để đảm bảo trải nghiệm của khách hàng ngồi tại bàn đạt tính chuyên nghiệp cao nhất, **thiết kế màn hình tablet sẽ giống hệt 100% với giao diện `CustomerOrderingPage.jsx` trong `admin-client`**, đồng thời **tích hợp đầy đủ tính năng Chatbot AI** (kết nối trực tiếp với API chatbot của hệ thống).

---

## User Review Required

> [!IMPORTANT]
> **Hợp nhất thiết kế E-Menu Tablet cực kỳ cao cấp:**
> * Chúng ta sẽ chuyển giao toàn bộ giao diện và cấu trúc của `CustomerOrderingPage.jsx` từ `admin-client` sang `restaurant-client` dưới dạng một Component riêng biệt tên là **`TableOrderingPage.jsx`**.
> * Component này sẽ tích hợp sẵn:
>   * **Giao diện Menu chia nhóm theo danh mục nằm ngang** với icon động.
>   * **Thanh tìm kiếm trực quan có debounce**.
>   * **Giỏ hàng trượt (Slide-out Cart)** và nút đặt món nhanh.
>   * **Tab theo dõi món thời gian thực (Order Tracking)** kết nối trực tiếp đến Firestore để cập nhật trạng thái làm món của bếp (Chờ nấu -> Đang nấu -> Hoàn thành).
>   * **Floating Chatbot Button và Chatbot Drawer** kết nối với API `/api/chat` để hỗ trợ tư vấn món ăn thông minh qua Gemini AI!

> [!NOTE]
> **Cơ chế Router trong suốt (Transparent Routing):**
> Để không phá vỡ cấu trúc định tuyến hiện tại của ứng dụng Khách, chúng ta sẽ thực hiện chặn lọc ngay trong `MenuPages.jsx`. Nếu phát hiện `"rq-table-mode": "true"` trong `localStorage`, trang `/menu` sẽ hiển thị **`TableOrderingPage.jsx`**, ngược lại sẽ hiển thị trang Thực đơn truyền thống cho khách mua online thông thường.

---

## Proposed Changes

### 1. Admin Dashboard (`admin-client`)

#### [MODIFY] [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx)
* **Thêm Tabs chuyển đổi:** Bổ sung thanh tab chuyển đổi giữa `"Danh sách đặt bàn"` và `"Sơ đồ bàn"`.
* **Sơ đồ Bàn trực quan (Table Map Grid):**
  * Gọi API `GET /api/admin/tables` kết hợp lắng nghe Firestore `activeReservations` theo thời gian thực.
  * Hiển thị lưới Grid các bàn ăn với màu sắc hiện đại, sang trọng theo trạng thái:
    * Trống (`AVAILABLE` - Xám/Xanh nhạt): Hiện số chỗ. Bấm vào hiển thị Modal có nút **"Mở Bàn Khách Vãng Lai"** (gọi `/api/admin/reservation/quick-checkin?tableId=X`).
    * Có khách (`OCCUPIED` - Xanh dương/Đỏ): Hiển thị nút **"Xem mã QR"** (Modal QR dự phòng cho điện thoại khách nếu cần) và **"Xem chi tiết ăn uống"** (điều hướng sang trang hóa đơn `/reservations/${reservationId}`).
* **Mở giả lập Tablet nhanh:**
  * Modal QR của mỗi bàn có thêm nút **"Mở giả lập Tablet"**. Khi dev bấm nút này, hệ thống sẽ mở tab trình duyệt mới trỏ thẳng tới `http://localhost:5173/menu?tableMode=true&tableId=X` để thử nghiệm lập tức cực kỳ tiện lợi.

---

### 2. Customer Portal (`restaurant-client`)

#### [NEW] [FloatingChatButton.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/common/FloatingChatButton.jsx)
* Sao chép từ `admin-client`, tích hợp hiệu ứng gợn sóng phát sáng màu xanh dương đậm chất công nghệ để làm nút mở Chatbot.

#### [NEW] [ChatbotDrawer.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/common/ChatbotDrawer.jsx)
* Sao chép từ `admin-client`, thiết kế Glassmorphism mịn màng với khung chat hỗ trợ các câu hỏi gợi ý nhanh, hộp nhập liệu, trạng thái hiển thị "AI Assistant đang gõ..." và cuộn mượt xuống dưới.

#### [NEW] [TableOrderingPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/pages/TableOrderingPage.jsx)
* **Màn hình chờ Standby Screen:** Hiển thị khi bàn chưa kích hoạt. Tông màu obsidian `#090d16` huyền bí, hiệu ứng phát sáng chuyển động chậm, đi kèm lời chào đón và badge: `📍 Máy tính bảng cố định tại Bàn X`.
* **Firestore Auto-Activation Listener:**
  * Khi phát hiện bàn đã được mở:
    1. Gọi API `GET /api/order_session/active-session?tableId=X` lấy `sessionToken`.
    2. Gọi API `GET /api/order_session/join?token=[sessionToken]` để nhận `customerJwt` và `sessionId`.
    3. Cài đặt cookies `token` và cập nhật thông tin Guest user vào `useUserStore`.
    4. Kích hoạt E-Menu Tablet đầy đủ tính năng.
* **Tích hợp Gọi Chatbot API:**
  * Viết hàm gửi tin nhắn `handleSendChatMessage(text)` kết nối trực tiếp đến API `/api/chat` bằng axios, truyền vào `{ userMessage: text, sessionToken: sessionToken }`.
  * Cập nhật phản hồi từ chatbot AI vào danh sách tin nhắn để hiển thị trực quan lên bong bóng chat.
* **Auto-Lock & Reset:**
  * Khi bàn được thanh toán (Firestore Record bị xóa), tự động xóa cookie `token`, giỏ hàng, và đưa màn hình quay lại trạng thái Standby ban đầu.

#### [MODIFY] [MenuPages.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/pages/MenuPages.jsx)
* **Bộ chuyển đổi Định tuyến trong suốt (Transparent Route Switcher):**
  * Tại đầu file, đọc tham số `tableMode` và `tableId` trên URL (nếu có thì lưu vào `localStorage` vĩnh viễn và làm sạch URL).
  * Kiểm tra biến `isTableMode = localStorage.getItem("rq-table-mode") === "true"`.
  * **Nếu `isTableMode` là true:** Trả về Component `<TableOrderingPage />` ngay lập tức.
  * **Nếu false:** Tiếp tục render trang thực đơn thông thường như cũ.

---

## Verification Plan

### Kịch bản kiểm thử tự động đồng bộ (End-to-End Synced Walkthrough)

1. **Bước 1: Thiết lập Máy tính bảng cố định**
   * Mở trình duyệt ẩn danh tại địa chỉ: `http://localhost:5173/menu?tableMode=true&tableId=5`
   * Xác minh:
     * Máy ghi nhớ cấu hình Bàn 5 và tự dọn dẹp URL.
     * Trình duyệt hiển thị giao diện Standby chờ đón khách tuyệt đẹp với dòng chữ *"Vui lòng đợi phục vụ mở bàn..."* và badge `📍 Máy tính bảng cố định tại Bàn 5`.

2. **Bước 2: Kích hoạt bàn trên Admin**
   * Mở trình duyệt chính, đăng nhập Admin tại `http://localhost:5174/reservations`, chuyển sang tab **Sơ đồ bàn**.
   * Bấm vào `Bàn 5` (đang hiển thị màu xanh - Trống) và chọn **"Mở Bàn Khách Vãng Lai"**.
   * Xác minh: Bàn 5 trên Sơ đồ Admin lập tiếp chuyển sang màu đỏ (Bận).

3. **Bước 3: Tự động kích hoạt & Trải nghiệm Chatbot**
   * Xác minh trên màn hình Tablet Bàn 5:
     * Giao diện Standby biến mất, thay thế bằng E-Menu Tablet cao cấp (Giống hệt `CustomerOrderingPage`).
     * Có nút bóng chat tròn màu xanh dương "Hỏi bot" nhấp nháy góc dưới.
     * Bấm vào nút bóng chat để mở Drawer Chatbot AI.
     * Nhập tin nhắn: *"Gợi ý cho tôi món ăn nào ngon của quán"* và gửi.
     * Xác minh: Chatbot hiển thị hiệu ứng ba chấm đang gõ, sau đó trả về gợi ý món ăn thực tế từ Backend vô cùng nhanh chóng.

4. **Bước 4: Đồng bộ hóa khi Thanh toán**
   * Tại màn hình Admin, tiến hành xử lý thanh toán cho `Bàn 5` để đóng phiên ăn.
   * Xác minh: 
     * Ngay khi Admin hoàn tất thanh toán, màn hình Tablet Bàn 5 tự động biến đổi trở lại màn hình chờ Standby đón khách ban đầu.
     * Cookie đăng nhập và giỏ hàng cũ được xóa sạch hoàn toàn để chuẩn bị cho lượt khách tiếp theo.
