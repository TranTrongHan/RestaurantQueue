# Hướng dẫn và Kế hoạch triển khai `react-hot-toast`

Tài liệu này giải thích cách sử dụng thư viện `react-hot-toast` để hiển thị thông báo popup (toast) và vạch ra kế hoạch thay thế các component Alert hiện tại trong dự án.

## 1. Tại sao lại là `react-hot-toast`?

`react-hot-toast` là một trong những thư viện thông báo tốt nhất cho React hiện nay vì:
- **Cài đặt cực kỳ đơn giản:** Chỉ cần gọi một hàm `toast()`.
- **Rất nhẹ và nhanh.**
- **Giao diện hiện đại, dễ dàng custom:** Phù hợp hoàn hảo với Tailwind CSS.
- **Không gây rối giao diện:** Thông báo nổi ở mép màn hình, không đẩy lệch các thành phần UI khác.

## 2. Cách sử dụng cơ bản

1. **Cài đặt package:**
   ```bash
   npm install react-hot-toast
   ```

2. **Khởi tạo (Chỉ cần 1 lần duy nhất trong `App.jsx`):**
   Thêm component `<Toaster />` vào root của ứng dụng.
   ```jsx
   import { Toaster } from 'react-hot-toast';

   const App = () => {
     return (
       <BrowserRouter>
         <Toaster position="top-right" reverseOrder={false} />
         {/* Các Routes khác */}
       </BrowserRouter>
     );
   }
   ```

3. **Gọi thông báo ở mọi nơi:**
   ```jsx
   import toast from 'react-hot-toast';

   // Báo thành công
   toast.success('Đã cập nhật thông tin thành công!');

   // Báo lỗi
   toast.error('Có lỗi xảy ra, vui lòng thử lại.');

   // Thông báo chung
   toast('Đơn hàng mới đã được tạo.');
   ```

---

## 3. Kế hoạch thay thế các Alert hiện tại

Dự án hiện đang sử dụng `AlertComp` (dựa trên react-bootstrap) và một số đoạn HTML alert tuỳ chỉnh. Chúng ta sẽ thay thế chúng bằng `react-hot-toast`. 

**Yêu cầu quan trọng:** KHÔNG xoá các component thông báo cũ. Hãy *comment out* (chú thích) lại để giữ lịch sử source code nếu cần tham khảo.

### Danh sách các Component cần xử lý:

#### 1. `src/components/layout/CommentSection/CommenSection.jsx`
- **Hiện trạng:** Đang dùng `<AlertComp variant="success" />` và `<AlertComp variant="danger" />`. Cần state `success` và `error` đi kèm với `useEffect` để auto-clear sau 5 giây.
- **Hành động:** 
  - Comment out thẻ `<AlertComp.../>` và các state/useEffect liên quan nếu không dùng tới mục đích hiển thị tĩnh UI.
  - Sửa `handleSubmit`: Khi call API thành công thì gọi `toast.success(res.data.result.message)`. Khi có lỗi thì gọi `toast.error(error.message)`.

#### 2. `src/components/pages/SessionPage/SessionPage.jsx`
- **Hiện trạng:** Đang import và sử dụng `<AlertComp>` ở nhiều chỗ.
- **Hành động:** 
  - Comment out `<AlertComp>`.
  - Thay thế bằng việc gọi `toast.error` hoặc `toast.success` trực tiếp trong khối catch error hoặc res.status === 200.

#### 3. `src/components/pages/ProfilePage.jsx`
- **Hiện trạng:** Đang tự code `<div className="mt-4 p-4 rounded-xl bg-success-light text-success-dark">...</div>` (Phần `# Toast Alerts`).
- **Hành động:** 
  - Chuyển `setSuccess("...")` trong hàm `handleSaveProfile` thành `toast.success("...")`.
  - Comment out toàn bộ thẻ render Toast/Alert thủ công trong JSX.

#### 4. `src/components/forms/TableBookingForm.jsx` và `ReservationDetailPage.jsx`
- **Hiện trạng:** Có các block HTML xử lý hiển thị cảnh báo tĩnh hoặc linh động.
- **Hành động:** 
  - Xem xét từng Alert. Nếu là "Toast" (hiển thị nhanh trôi qua) thì dùng `react-hot-toast`.
  - Nếu là dạng "Banner" gắn liền trên form (ví dụ: cảnh báo "Số lượng người không được trống") thì vẫn nên giữ lại UI cũ vì nó báo lỗi ngữ cảnh.

---

## 4. Các bước tiến hành (Next Steps)

1. Cài đặt thư viện `npm install react-hot-toast`.
2. Thêm `<Toaster />` vào `App.jsx`.
3. Lần lượt vào 4 file bên trên để refactor code (comment code cũ, thêm `toast`).
4. Kiểm tra lại luồng hoạt động UI.
