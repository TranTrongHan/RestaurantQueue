 Tóm tắt Kiến trúc Firebase Realtime cho Frontend (FE)
Hệ thống đã chuyển sang mô hình Reservation-Centric (Tập trung vào đơn đặt bàn). Tất cả dữ liệu của một lượt ăn (từ lúc check-in đến lúc thanh toán) sẽ nằm dưới reservationId.

1. Cấu trúc Firestore (Path)
Document cha (Thông tin chung & Tổng tiền): activeReservations/{reservationId}
Sub-collection (Danh sách món ăn): activeReservations/{reservationId}/orderItems
2. Chi tiết Dữ liệu & Hành động cho FE
✅ Hành động 1: Khách hàng theo dõi trạng thái món ăn (Tablet UI)
Listener (Path): activeReservations/{reservationId}/orderItems
Các trường dữ liệu chính của một món ăn:
name: Tên món (String).
quantity: Số lượng (Number).
status: Trạng thái món (String). Các giá trị:
PENDING: Mới gửi bếp, đang chờ phân công.
COOKING: Đầu bếp đang nấu.
DONE: Đã nấu xong, sẵn sàng phục vụ.
price: Đơn giá (để FE hiển thị nếu cần).
note: Ghi chú của khách (String).
orderedAt: Thời điểm gọi món (Server Timestamp).
✅ Hành động 2: Lễ tân theo dõi chi tiết đặt bàn & Tổng tiền (Admin UI)
Listener (Document): activeReservations/{reservationId}
Các trường dữ liệu quan trọng:
totalAmount: Tổng tiền tạm tính (Number). Backend đã tự động tính toán tổng số tiền của tất cả các món ăn (ngoại trừ các món bị hủy). FE chỉ việc lấy trường này hiển thị trực tiếp.
tableName: Tên bàn (Ví dụ: "Bàn 05").
status: Trạng thái lượt ăn (Ví dụ: CHECKEDIN, CHECKEDOUT).
Danh sách món: Lễ tân cũng Listen vào Sub-collection orderItems tương tự như Tablet để thấy món nào đã nấu xong, món nào chưa.
3. Quy trình vận hành (Frontend Flow)
Ngay sau Check-in: Backend sẽ tự động tạo Document gốc /activeReservations/{reservationId}. FE có thể bắt đầu Listen từ lúc này.
Khi Khách gọi món: Khi Tablet gọi API gửi món thành công, Backend sẽ tự đẩy món vào Firestore. FE sẽ tự động nhận được qua Listener (không cần reload).
Khi Bếp nấu/Xong: Backend cập nhật status trong Firestore -> FE cập nhật icon/trạng thái trên màn hình Tablet ngay lập tức.
Khi Hủy món: Backend xóa món khỏi Firestore và tự động trừ tiền vào trường totalAmount. FE sẽ thấy danh sách món biến mất và tổng tiền nhảy số mới.
💡 Lưu ý cho FE:

Luôn sử dụng reservationId làm khóa chính để Listen dữ liệu.
Trường totalAmount đã được xử lý bằng Firestore Transaction ở phía Backend nên độ chính xác là tuyệt đối, FE không cần tự tính lại trên Client.