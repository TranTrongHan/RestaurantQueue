# Thảo Luận: Tối Ưu Hóa Quy Trình Xử Lý Món Ăn (Kitchen Assignment)

Chào bạn, dựa trên việc xem xét mã nguồn của hệ thống và các vấn đề bạn đưa ra, với tư cách là một Senior Spring Boot Developer chuyên mảng F&B, mình hoàn toàn đồng tình với góc nhìn của bạn. Việc tối ưu hóa quy trình luân chuyển món ăn từ thiết bị order (Tablet) xuống bếp (KDS - Kitchen Display System) là một bước đi cực kì chính xác, giúp hệ thống nhẹ nhàng và sát với thực tế vận hành hơn.

Dưới đây là phần thảo luận chi tiết cho từng ý bạn đề xuất:

## 1. Có cần thiết phải gán món ăn cho từng đầu bếp cụ thể không?

**Nhận định của bạn:** "Hệ thống chỉ cần biết món đó đã hoàn thành hay chưa, không quan trọng ai là người hoàn thành."

**Đánh giá:** **Hoàn toàn đồng ý. Việc gán cụ thể một món cho một đầu bếp thường là thiết kế "Over-engineering" (làm phức tạp quá mức cần thiết) trong ngành F&B.**

> [!TIP]
> **Thực tế vận hành:** Trong một gian bếp thực tế, các món order gửi xuống sẽ hiển thị trên một màn hình chung (Kitchen Display System - KDS). Đầu bếp nào rảnh hoặc phụ trách thớt mộc/thớt chín/bếp nướng sẽ nhìn vào màn hình và tự động tiến hành làm món. Việc cố gắng code logic "gán tự động" từ backend thường đi tới ngõ cụt do phần mềm không đo đếm được tình trạng vật lý (độ mỏi, rảnh tay thực tế) của đầu bếp.

**Giải pháp đề xuất:**
- Chuyển từ mô hình **Push** (Hệ thống tính toán và ép việc cho đầu bếp) sang mô hình **Pull** (Danh sách order hiển thị chung trên KDS, bếp rảnh sẽ chủ động click "Bắt đầu nấu" hoặc hệ thống tự hiểu món đang chạy khi màn hình trôi xuống).
- Nếu nhà hàng chia khu (Ví dụ: Pha Chế, Bếp Nóng, Bếp Lạnh), thì phân loại OrderItem theo **Station (Khu vực)** của `MenuItem_Category` thay vì `User` (Đầu bếp). Nghĩa là món nước uống thì tự động nhảy sang màn hình của quầy Bar, đồ nướng nhảy sang màn hình khu Nướng. Việc này dễ quản lý và chuẩn xác hơn tỷ lần.

## 2. Dọn luồng cũ: Giữ lại EstimatedTime & Bỏ việc gán nấu tự động

**Nhận định của bạn:** "Giữ lại logic update thời gian dự kiến ra món, bỏ đi logic gán bếp vì cơ chế điểm ưu tiên (priority score) đã bỏ"

**Đánh giá:** **Rất hợp lý để tối ưu hệ thống.**

- Trong file `OrderSessionService.java` ở hàm `createOrderItem`, logic tính `PriorityScore` qua Redis ZSet đã được bạn comment loại bỏ. Do đó, lời gọi `kitchenAssignmentService.assignDishesToAllAvailableChefs()` lúc này hoàn toàn không còn mang lại ý nghĩa sâu sắc, chỉ làm cồng kềnh database với các bảng trung gian không cần thiết.
- Việc giữ lại thuộc tính `estimatedTime`, `deadlineTime` và lưu tại `OrderItem` lại cực kỳ có lợi trong business F&B:
  - Cho phép hiển thị đếm ngược (countdown) cho khách hàng biết tình trạng đơn hàng trên Tablet ("Dự kiến 15 phút nữa đồ ăn có").
  - Hiển thị cờ đỏ (Red flag / Cảnh báo trễ) trên màn hình KDS nếu món ăn quá thời gian `deadlineTime` mà chưa ra món.

> [!IMPORTANT]
> **Plan Refactor:**
> 1. Xóa bỏ hoàn toàn hàm gọi `assignDishesToAllAvailableChefs();` trong Transaction `afterCommit()` của `OrderSessionService`
> 2. Có thể gỡ bỏ/Deprecate toàn bộ hệ thống các hàm, Service `KitchenAssignmentService` và Entity `KitchenAssignment`. Sau này `OrderItem` chỉ cần gắn thẳng vòng đời vào `Order` và tự thân quản lý bằng thuộc tính `status`.

## 3. Thêm API cho Bếp cập nhật trạng thái món: "Bắt Đầu Nấu" (COOKING)

**Nhận định của bạn:** "Nên thêm API để bếp cập nhật trạng thái món là bắt đầu nấu"

**Đánh giá:** **Đây là Flow cực kì chuẩn - Một mảnh ghép không thể thiếu.**

Việc hiện tại của bạn là đang gắn ngay kết quả khi bấm Submit Order vào `PENDING` và chờ bếp hoàn thiện `COMPLETED`. Việc bỏ lỡ trạng thái "Đang nấu" (`COOKING` hoặc `IN_PROGRESS`) sẽ để lại lỗ hổng:
- Khách không biết khi nào món được "tiếp nhận" thay vì chờ vô vọng.
- Nhà hàng không phân tích được **Thời Gian Thực Tế Chế Biến** (Khoảng thời gian từ `COOKING` đến `COMPLETED`) để tối ưu hóa năng suất nhà bếp. Thời gian chờ (Từ `PENDING` -> `COOKING`) cũng rất quan trọng để biết phục vụ có lên đơn chậm hay không.

**Luồng trạng thái chuẩn nên là:**
1. **PENDING:** Tablet gửi order. Món hiển thị chờ lên màn KDS của Bếp.
2. **COOKING:** Đầu bếp trên trạm thực hiện thao tác bấm "Bắt Đầu". Đẩy thông báo Firestore cập nhật màn Tablet của khách là "Đang chế biến".
3. **COMPLETED / READY:** Đầu bếp bấm "Xong". Tablet báo khách món sắp ra.
4. (Optional) **SERVED:** Phục vụ mang ra tận bàn bấm confirm.

**Đề xuất cấu trúc API Status Transition:**
Thiết kế thêm 1 enpoint cho phép cập nhật trạng thái đơn hàng (Sử dụng `@PatchMapping` vì ta chỉ update 1 trường trạng thái của OrderItem).

```java
@PatchMapping("/order-items/{orderItemId}/status")
public ApiResponse<Void> updateOrderItemStatus(
        @PathVariable Integer orderItemId, 
        @RequestParam OrderItem.OrderItemStatus newStatus) {
            
    // 1. Kiểm tra tính hợp lệ của logic cập nhật trạng thái tuần tự
    // PENDING -> COOKING -> COMPLETED
    
    // 2. Cập nhật record 
    // orderItem.setStatus(newStatus);
    
    // 3. (Optional) Lưu lại thời điểm "Bắt đầu nấu" hoặc "Hoàn thành nấu"
    // if (newStatus == COOKING) orderItem.setActualStartTime(now);
    
    // 4. Gọi firestoreService để báo lại UI của khách real-time.
    return ApiResponse.<Void>builder().message("Trạng thái món đã được cập nhật!").build();
}
```

---

Mình nghĩ định hướng trên của bạn là **rất chuẩn với mô hình F&B thực chiến**. Nếu bạn đồng ý, mình có thể bắt tay ngay vào việc gỡ các logic cồng kềnh `KitchenAssignment` và viết thêm API đổi trạng thái món từ cho KDS như vừa thảo luận nhé!
