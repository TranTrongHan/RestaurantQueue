# Tổng kết: Tái cấu trúc Quy Trình Bếp (Kitchen Fulfillment Flow)

Dưới đây là tóm tắt những thay đổi đã thực hiện ở phía Backend để chuyển đổi từ luồng phân công bếp tự động (Push model) sang luồng bếp chủ động nhận món (Pull model), cùng với danh sách các API mới nhất để team Frontend (FE) ráp vào.

## 1. Những thay đổi đã thực hiện (Backend)

- **Vô hiệu hóa toàn bộ cơ chế gán món cũ (KitchenAssignment)**: 
  - Đóng băng (`@Deprecated` và comment out) toàn bộ Entity, Repository, Mapper, Controller liên quan đến `KitchenAssignment`.
  - Disable Redis Stream listener (`KitchenStreamListener`) dùng để lắng nghe sự kiện chia món cho bếp. Bây giờ FE bếp sẽ lắng nghe trực tiếp từ Firestore.
  - Gỡ bỏ liên kết quan hệ `@OneToOne` rườm rà trong `OrderItem.java` giúp câu query nhẹ hơn.

- **Tái cấu trúc Service xử lý món (OrderItemService mới)**:
  - Tạo mới hoàn toàn `OrderItemService` nhằm đảm nhiệm trọn gói vòng đời của một món ăn trong order.
  - **Di dời gọn gàng:** Rút logic `createOrderItem` (gọi món) và `cancelOrderItem` (hủy món) từ `OrderSessionService` qua đây.
  - **Thống nhất luồng trạng thái:** Tích hợp logic `updateStatus` (PENDING -> COOKING -> DONE). Khi hoàn tất món, hệ thống tự độ đo thời gian thực tế đã nấu (`ActualCookingTime`) và chắt lọc tính lại thời gian chờ trung bình (`AvgCookingTime`).
  - **Realtime Firebase:** Gắn triệt để `FirestoreService` vào các thao tác: gọi món, cập nhật trạng thái, hủy món.

- **Tái cấu trúc Controller (OrderItemController mới)**:
  - Cô lập các API của thao tác món ăn thao ra một mảng endpoint riêng (`/api/order_item`) để dễ quản lý phân quyền và rành mạch hơn với luồng Session hiện có.

---

## 2. API Documentation (Cần FE chú ý cập nhật URL)

Do cấu trúc lại, các API gọi món / hủy món trước đây nằm ở `OrderSessionController` đã **đổi base path** sang `/api/order_item/`. 

### 2.1. API Dành cho thiết bị Khách (Tablet UI)

#### 📝 Gọi món vào bếp (Send to Kitchen)
- **Method & URL**: `POST /api/order_item/{sessionId}`
- **Logic**: Sẽ lặp qua từng món được đẩy lên, tạo thành các record có trạng thái mặc định là `PENDING`, tính toán thời gian `estimateTime` (dự kiến ra món), đẩy realtime qua Firestore.
- **Request Body**:
  ```json
  {
      "menuItemRequestList": [
          {
              "menuItemId": 1,
              "quantity": 2
          }
      ]
  }
  ```

#### 🗑️ Hủy món (Chỉ hủy được khi trạng thái hiện hành là `PENDING`)
- **Method & URL**: `DELETE /api/order_item/{orderItemId}`
- **Logic**: Xóa món ăn khỏi DB, tính toán để loại bỏ số tiền của món bị hủy ra khỏi Firestore realtime của session đó.
- **Response**: Thành công trả về message báo hủy thành công. 

---

### 2.2. API Dành cho Bếp (KDS - Kitchen Display System)

Bếp sẽ lắng nghe các thay đổi từ mảng `orderItems` trên document của Reservation ở Firestore và nhóm lại theo giao diện Kanban hoặc Bàn. Khi bếp tương tác trên màn hình, gọi API dưới đây để Backend cập nhật DB (tiếp tục trigger firestore cho khách vòng lại).

#### 🍳 Cập nhật trạng thái món
- **Method & URL**: `PUT /api/order_item/{orderItemId}/status`
- **Query Params**: `status` (`COOKING` hoặc `DONE`)
- **Ví dụ**: `PUT /api/order_item/105/status?status=COOKING`
- **Logic tự động ngầm**:
  - Chuyển từ **PENDING -> COOKING**: Lưu lại mốc thời gian bắt đầu nấu (`startTime = now`).
  - Chuyển từ **COOKING -> DONE**: Dùng thời gian hiện tại trừ đi `startTime` để ra thời gian lấy nấu cho dĩa đó, rồi đưa vào công thức EMA (Exponential Moving Average) để cập nhật độ trễ trung bình của nhà hàng món đó cho hệ thống.
  - Sau cùng, Firebase Push được gọi để cả KDS Màn bếp và Màn Khách đều nhận được tín hiệu realtime.
