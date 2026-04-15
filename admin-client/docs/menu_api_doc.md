# Tài liệu API Quản lý Món ăn (MenuItem)

Tài liệu này cung cấp thông tin chi tiết về các API quản lý món ăn cho cả Admin và Khách hàng sau khi đã refactor DTO từ Thymeleaf sang REST API.

## 1. APIs dành cho Khách hàng (Công khai)

Các API này chỉ trả về các món ăn đang ở trạng thái hoạt động (`isAvailable = true`).

- **Lấy danh sách món ăn**: `GET /api/menu_items?cateId={categoryId}`
- **Tìm kiếm món ăn**: `GET /api/menu_items/search?q={keyword}`

---

## 2. APIs dành cho Admin (Yêu cầu quyền ADMIN)

Tất cả các API dưới đây bắt đầu bằng `/api/menu_items/admin`.

### 2.1. Lấy toàn bộ danh sách món ăn (Bao gồm món đã ẩn)
- **Endpoint**: `GET /api/menu_items/admin`
- **Tham số**: `cateId` (tùy chọn)
- **Mô tả**: Trả về danh sách tất cả món ăn để Admin quản lý.

### 2.2. Thêm món ăn mới
- **Endpoint**: `POST /api/menu_items/admin`
- **Content-Type**: `multipart/form-data`
- **Tham số (Body - FormData)**:
    - `name` (String)
    - `price` (BigDecimal)
    - `categoryId` (Integer)
    - `avgCookingTime` (Double)
    - `description` (String, tùy chọn)
    - `file` (MultipartFile, tùy chọn): Ảnh món ăn.
    - `isAvailable` (Boolean, mặc định `true`)

### 2.3. Cập nhật món ăn
- **Endpoint**: `PUT /api/menu_items/admin/{menuItemId}`
- **Content-Type**: `multipart/form-data`
- **Tham số (Body - FormData)**: Tương tự API thêm mới.
- **Lưu ý**: Nếu không gửi `file`, hệ thống sẽ **giữ nguyên ảnh cũ**.

### 2.4. Bật/Tắt trạng thái món ăn (Quick Toggle)
- **Endpoint**: `PATCH /api/menu_items/admin/{menuItemId}/status`
- **Tham số (Query)**: `isAvailable` (boolean)
- **Ví dụ**: `/api/menu_items/admin/1/status?isAvailable=false`

### 2.5. Xóa món ăn
- **Endpoint**: `DELETE /api/menu_items/admin/{menuItemId}`

---

## 3. Thay đổi về DTO (Quan trọng cho Frontend)

Nhằm tách biệt giữa luồng đặt món và luồng quản lý, mình đã refactor lại tên DTO:

- **MenuItemRequest**: Dùng cho các luồng quản lý (Admin).
- **OrderItemRequest**: (Tên cũ là `MenuItemRequest`) Dùng cho luồng đặt hàng (Customer/Session). Vui lòng cập nhật lại mapping trên UI nếu bạn đang gọi API đặt món.

---

## 4. Cấu trúc Response (MenuItemResponse)

Sau khi refactor, các API trả về `MenuItemResponse` sẽ bao gồm:
- `menuItemId` (Integer)
- `name` (String)
- `price` (BigDecimal)
- `image` (String)
- `description` (String)
- `avgCookingTime` (Double)
- `categoryId` (Integer)
- `categoryName` (String)
- `isAvailable` (Boolean)

---

> [!IMPORTANT]
> Admin APIs sử dụng `@ModelAttribute` để hỗ trợ gửi cả dữ liệu JSON và File (ảnh) trong cùng một request. Team Frontend nên sử dụng đối tượng `FormData` khi gọi các API `POST` và `PUT`.
