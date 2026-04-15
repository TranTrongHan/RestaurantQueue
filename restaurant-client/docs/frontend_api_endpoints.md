# Tổng Hợp RESTful API Dành Cho Frontend

Tài liệu này tổng hợp toàn bộ các API công khai và yêu cầu xác thực (`/api/**`) của dự án để đội ngũ Frontend có thể dễ dàng map và fetch dữ liệu. Các Endpoint này đều nằm dưới cấu trúc gốc (VD: `http://localhost:8080/restaurantserver/api`).

> [!TIP]
> **Authentication Headers:** Ngoại trừ các API có ghi chú *(Public)*, tất cả các API khác đều cần đính kèm JWT vào Request Header.
> Format Cứu Pháp: `Authorization: Bearer <your_jwt_token>`

---

## 1. Module Authentication (Xác thực Người Dùng)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | `{username, password}` (LoginRequest) | Đăng nhập tài khoản Local *(Public)* |
| **POST** | `/api/auth/logout` | `token` (String) | Đăng xuất người dùng |
| **GET** | `/api/auth/profile` | Không yêu cầu | Lấy thông tin user hiện tại (Dựa trên JWT) |

> [!NOTE]
> Về OAuth2 (Google Login), Frontend nên redirect user thẳng đến `/oauth2/authorization/google` và thiết lập Frontend đón Token trả về ở cấu hình OAuth2 Success Handler của Server.

---

## 2. Module Menu & Món Ăn (Menu Item & Category)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/categories` | Không yêu cầu | Lấy danh sách toàn bộ các danh mục thực đơn *(Public)* |
| **GET** | `/api/menu_items` | `categoryId` (Query Param / Optional) | Lấy danh sách toàn bộ món ăn (Lọc theo DM) *(Public)* |
| **GET** | `/api/menu_items/search` | `keyword` (String) | Tìm kiếm chính xác món theo tên tiếng việt *(Public)* |
| **GET** | `/api/menu-item-vector` | `keyword` (String) | Tìm kiếm từ khóa FTS bằng Redis N-Gram *(Public)* |

---

## 3. Module Reservation (Đặt Bàn - Phục vụ In-house)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/reservation/add` | `TableBookingRequest` | Tạo lịch Đặt Bàn (Yêu cầu Role: Customer) |
| **GET** | `/api/reservation/my` | Không yêu cầu | Liệt kê các đặt bàn của tôi |
| **GET** | `/api/reservation/{id}`| `id` (Path variable) | Lấy chi tiết lịch Đặt Bàn |
| **PUT** | `/api/reservation/{id}`| `ReservationUpdateRequest` | Cập nhật thông tin đặt bàn |
| **POST** | `/api/reservation/{id}`| `id` (Path variable) | Check-In đến quán (Chuyển reservation -> Session Đặt món) |
| **DELETE** | `/api/reservation/{id}`| `id` (Path variable) | Hủy Đặt Bàn (Cancel Reservation) |
| **GET** | `/api/reservation` | `map param` (Pagination) | *(Role Admin/Staff)* Lấy danh sách tổng hợp đặt bàn |

---

## 4. Module Bàn Ăn (Table)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tables` | Tùy chọn (Map filtering) | Lấy danh sách toàn bộ Bàn trống / Bàn bận |

---

## 5. Module Order Session (Gọi Món & Check-out tại Quán - DINE_IN)
**Lưu ý:** `sessionId` là Token sinh ra và trao cho người dùng khi Check-In bàn (Từ Reservation hoặc quét QR).
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/order_session/validate` | `sessionToken` (Query) | Kiểm tra Check-In hợp lệ *(Public)* |
| **POST** | `/api/order_session/{sessionId}/orderitems`| `OrderRequest`, Note (Query) | Chọn món lúc ăn tại quán (Lên hoá đơn bếp) |
| **GET** | `/api/order_session/{sessionId}` | `sessionId` (Path) | Tải hóa đơn/món ăn đang chờ của Bàn này |
| **DELETE** | `/api/order_session/{orderItemId}` | `orderItemId` (Path) | Hủy gọi một món |
| **POST** | `/api/order_session/createPayment/{sessionId}` | `PaymentRequest`, `returnUrl` | Thanh toán hóa đơn bằng VNPay cho Bàn ăn |
| **POST** | `/api/order_session/{sessionId}` | `sessionId` (Path) | Xác nhận thanh toán trực tiếp/Cash tại quầy |
| **GET** | `/api/order_session/vnpayReturn` | Data IPN Map (Query) | Webhook callback xử lý từ VNPay. FrontEnd không cần call |

---

## 6. Module Cart & Online Order (Giỏ Hàng & Mua Mang Về - TAKE_HOME)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/cart` | Không yêu cầu | Xem toàn bộ Giỏ hàng cá nhân |
| **POST** | `/api/cart/add` | `AddToCartRequest` | Thêm món Online vào giỏ hàng |
| **PUT** | `/api/cart/items/{menuItemId}` | `menuItemId` (Path) | Cập nhật số lượng món trong giỏ |
| **DELETE** | `/api/cart/items/{cartItemId}` | `cartItemId` (Path) | Xóa một món khỏi giỏ hàng |
| **DELETE** | `/api/cart/clear` | Không yêu cầu | Làm trống toàn bộ giỏ hàng |
| **POST** | `/api/online_order/createPayment`| `PaymentRequest`, `returnUrl` (Query)| Checkout giỏ hàng & lấy URL VNPay |
| **GET** | `/api/online_order/vnpayReturn` | Data IPN Map (Query) | Cập nhật thành công / Clear giỏ Hàng |
| **GET** | `/api/online_order/my` | Không yêu cầu | Xem lịch sử mua sắm trực tuyến |
| **POST** | `/api/online_order` | `PaymentRequest` (Body) | Thanh toán trực tuyến Cash on Delivery COD |

---

## 7. Module Users & Profile
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/users/me` | Lấy Cookie/Session Token | Oauth2 User Info |
| **POST** | `/api/users` | `UserCreationRequest`, `MultipartFile` | Chức năng Đăng ký User *(Public)* (form-data) |
| **GET** | `/api/users` | Không yêu cầu | Lấy danh sách toàn bộ User (Cho Role: ADMIN/STAFF) |
| **GET** | `/api/users/{id}` | `id` (Path) | Đọc chi tiết User Info |
| **PUT** | `/api/users/{id}` | `UserUpdateRequest` (form-data) | Thay đổi profile/tên/địa chỉ |
| **PATCH** | `/api/users/{id}` | `MultipartFile` (form-data) | Thêm / Cập nhật ảnh đại diện (Avatar) |
| **DELETE** | `/api/users/{id}` | `id` (Path) | Xóa cấm tài khoản (Admin) |

---

## 8. Module Đánh Giá (Comments)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/comments` | Map param / Pageable | Lấy và Filter comment |
| **POST** | `/api/comments/add` | `CommentRequest` | Tạo Đánh giá / Bình luận mới cho nhà hàng |

---

## 9. Module Bills (Lịch Sử Hoá Đơn)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/bills` | Không yêu cầu | Lấy tất cả Hoá Đơn |
| **GET** | `/api/bills/{billId}` | `billId` (Path) | Xem chi tiết Hoá Đơn |

---

## 10. Module Kitchen (Nhà Bếp)
| Method | Endpoint | Tham số đầu vào (Params/Body) | Chức năng (Ý nghĩa) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/kitchen` | Map Filter (Pageable) | Tải danh sách đơn đặt món (OrderItems) vào Ticket Bếp |
| **PUT** | `/api/kitchen/{id}` | `id` (Path variable) | Đầu bếp Bấm **Hoàn Thành** món này để báo phục vụ đem ra bàn |

```javascript
// Ví dụ cấu hình Axios (Frontend) khi làm việc với API
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/restaurantserver/api', // Config chung
});

// Setup Auth Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
});

export default api;
```
