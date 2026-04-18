# Tài liệu Hướng dẫn Bảo vệ Khóa luận

Tài liệu này tổng hợp các luận điểm chiến lược dành cho việc phản biện trước Hội đồng, tập trung vào hai trụ cột chính của hệ thống: **Chatbot (Hệ thống hỗ trợ ra quyết định)** và **Ước tính thời gian (Hệ thống quản trị kỳ vọng)**.

---

## 1. Triết lý hệ thống (System Philosophy)

Khi được hỏi về mục đích cốt lõi, hãy nhấn mạnh:
- **Hệ thống không chỉ là ứng dụng đặt món**: Đây là một giải pháp chuyển đổi số toàn diện cho nhà hàng.
- **Tính năng Chatbot**: Đóng vai trò là **Decision Support System (DSS)**. Nó không chỉ trả lời câu hỏi mà còn điều hướng hành vi khách hàng dựa trên dữ liệu thực đơn thực tế.
- **Tính năng Ước tính thời gian**: Đóng vai trò là **Expectation Management System**. Mục tiêu không phải là "ép" đầu bếp, mà là "minh bạch hóa" quy trình chờ đợi để nâng cao sự hài lòng của khách hàng và tối ưu năng suất vận hành.

---

## 2. Trình bày về Cơ chế Ưu tiên (Priority Queue)

**Câu hỏi: "Công thức tính độ ưu tiên của bạn có quá đơn giản không?"**
- **Trả lời**: Hệ thống ưu tiên sự thực dụng và khả năng mở rộng. Việc sử dụng `priority` (1-3) dựa theo hạng thành viên (Membership Tier) đảm bảo quy trình công bằng nhưng vẫn mang lại giá trị kinh tế cho nhà hàng (giữ chân khách VIP). Đây là mô hình chuẩn mà các hệ thống lớn như sân bay hoặc ngân hàng đang áp dụng.

---

## 3. Trình bày về Logic Ước tính (Estimation Logic)

**Câu hỏi 1: "Tại sao em lại có công thức này? Nó dựa trên cơ sở khoa học nào?"**
- **Trả lời**: Công thức này được xây dựng dựa trên sự đơn giản hóa của **Lý thuyết Xếp hàng (Queueing Theory)**, cụ thể là mô hình $M/M/c$ (nhiều máy phục vụ song song). 
    - Phần $Max(Remaining_{cooking})$ phản ánh trạng thái hiện tại của "máy" (bếp).
    - Phần $\frac{\sum Pending_{load}}{N_{chefs}}$ phản ánh khối lượng công việc đang đứng đợi chia cho năng suất hệ thống.
    - Việc tính toán này giúp bao quát cả hai thành phần của thời gian chờ: **Thời gian chờ do hàng đợi** và **Thời gian phục vụ thực tế**.

**Câu hỏi 2: "Làm sao em biết công thức này phản ánh đúng thực tế và có chính xác không?"**
- **Trả lời**: Hệ thống không sử dụng một công thức "tĩnh". Độ chính xác được đảm bảo qua 2 cơ chế:
    1. **Thuật toán EMA (Exponential Moving Average)**: Hệ thống tự động cập nhật `avgCookingTime` liên tục sau mỗi món ăn hoàn thành. Nếu bếp hôm nay chậm, dữ liệu hệ thống sẽ tự "đậm" lên để phản ánh đúng thực tế mà không cần Admin can thiệp. (Đây là cơ chế **Self-Learning**).
    2. **Vòng lặp Phản hồi (Feedback Loop)**: Hệ thống theo dõi chỉ số `Delay Ratio` (Actual vs Estimated). Nếu tỷ lệ này lệch quá nhiều, Admin có thể điều chỉnh `KITCHEN_CAPACITY` để "calibrate" (hiệu chuẩn) lại hệ thống.

**Câu hỏi 3: "Ước tính thời gian thì liên quan gì đến hỗ trợ chọn món và quản lý kì vọng?"**
- **Trả lời**: 
    - **Quản lý kỳ vọng**: Khách hàng thường cảm thấy khó chịu vì sự "vô định" (uncertainty) chứ không hẳn vì thời gian lâu. Hiển thị `deadlineTime` giúp khách hàng làm chủ thời gian của mình, giảm "thời gian chờ đợi cảm tính".
    - **Hỗ trợ chọn món (DSS)**: Đây là điểm mấu chốt. Chatbot/Tablet dựa vào thời gian ước tính để gợi ý: *"Món Bít tết hiện đang quá tải (chờ 30p), bạn có muốn thử Mì Ý (chờ 10p) không?"*. Điều này giúp **điều hướng nhu cầu** (Demand Shifting), giúp nhà hàng tự cân bằng tải (Load balancing) và tăng vòng quay bàn (Table turnover).

---

## 4. Tác động đến Hiệu suất & Khả năng Vận hành

**Hệ thống giúp nhà hàng cải thiện bằng cách nào?**
1. **Dữ liệu hóa (Data-driven)**: Chuyển các khái niệm cảm tính như "khách chờ lâu" thành con số cụ thể (Actual time vs. Estimated time).
2. **Xác định nút thắt cổ chai**: Nhờ báo cáo thống kê, nhà hàng biết chính xác món nào đang làm chậm quy trình (Bottleneck identification).
3. **Cân bằng tải chủ động**: Thông qua thời gian ước tính hiển thị trên Tablet, khách hàng sẽ tự điều chỉnh hành vi chọn món nhanh nếu họ thấy bếp đang quá tải, giúp hệ thống tự cân bằng.

---

## 5. Phụ lục: Danh mục Công thức & Thuật toán (Algorithms Mapping)

Dưới đây là các công thức cốt lõi giúp hệ thống chuyển từ cảm tính sang dữ liệu định lượng:

### 1. Thuật toán Ước tính Thời gian (Time Estimation)
**Mô hình gốc:** Lý thuyết Xếp hàng (Queueing Theory - M/M/c).

$$ T_{wait} = T_{busy} + T_{queue} + T_{service} $$
$$ T_{wait} = \max(Remaining_{cooking}) + \frac{\sum (PrepTime_i \times Qty_i)}{Capacity_{kitchen}} + PrepTime_{self} $$

- **Ý nghĩa:** Giải bài toán chờ đợi bằng cách tính toán tải trọng (Workload) hiện tại của hệ thống.
- **Mapping thực tế:** 
    - $\max(Remaining_{cooking})$: Độ trễ do các món đang chiếm bếp.
    - $Capacity_{kitchen}$: Số lượng "Serving Channels" (Đầu bếp/Bếp nấu).

### 2. Thuật toán Cập nhật Năng suất (Dynamic Throughput)
**Mô hình gốc:** Đường trung bình động lũy thừa (Exponential Moving Average - EMA).

$$ Avg_{new} = Avg_{old} \times (1 - \alpha) + Actual \times \alpha $$
*(Trong hệ thống $\alpha = 0.3$)*

**Câu hỏi: "Tại sao em chọn $\alpha = 0.3$? Nếu chọn cao hơn hoặc thấp hơn thì sao?"**
- **Ý nghĩa của $\alpha$**: Đây là hệ số san phẳng (Smoothing factor), quyết định trọng số giữa **"Dữ liệu mới nhất"** và **"Kinh nghiệm quá khứ"**.
- **Tại sao chọn 0.3?**: Đây là giá trị tối ưu để giải quyết bài toán **Đánh đổi giữa Độ nhạy và Độ ổn định (Responsiveness-Stability Trade-off)**.
    - **0.3 đủ nhạy**: Để hệ thống nhận ra một xu hướng thay đổi thực sự (ví dụ: bếp bắt đầu vào giờ cao điểm và đuối sức).
    - **0.3 đủ ổn định**: Để loại bỏ các sai số ngẫu nhiên (Noise/Outliers) - ví dụ: chỉ một món duy nhất bị cháy phải làm lại khiến thời gian tăng đột biến, hệ thống sẽ không để lỗi cá biệt này làm ảnh hưởng quá lớn đến toàn bộ ước tính.
- **Nếu $\alpha$ cao (ví dụ 0.8)**: Hệ thống sẽ cực kỳ nhạy nhưng "nhảy nhót" (Jittery). Chỉ cần 1 món chậm, tất cả các ước tính tiếp theo sẽ tăng vọt, gây hoang mang cho khách hàng.
- **Nếu $\alpha$ thấp (ví dụ 0.05)**: Hệ thống sẽ rất trì trệ (Sluggish). Phải mất hàng chục đơn hàng thì hệ thống mới phản ánh đúng sự thay đổi năng suất nếu bếp có thay đổi nhân sự.

### 3. Công thức Tăng trưởng Thành viên (Loyalty Accrual)
**Mô hình gốc:** Mô hình thưởng đa tầng (Tiered Loyalty Model).

$$ Points = \lfloor \frac{Amount}{P_{vnd}} \rfloor \times Rate_{tier} $$

- **Mapping thực tế:** 
    - $P_{vnd}$: Cấu hình `LOYALTY_POINTS_PER_VND`.
    - $Rate_{tier}$: Đặc quyền riêng của từng hạng (Gold: 1.5x, Silver: 1.2x).

### 4. Thuật toán Điều hướng Nhu cầu (Demand Shifting via DSS)
**Mô hình gốc:** Hỗ trợ ra quyết định (Decision Support System).

$$ If (T_{wait}(Dish_i) > Threshold) \Rightarrow Suggest(Dish_j) \text{ where } T_{wait}(Dish_j) < T_{wait}(Dish_i) $$

- **Ý nghĩa:** Chatbot không chỉ trả lời thông tin mà còn thực hiện tối ưu hóa lưu lượng (Load balancing) cho bếp.

---

> [!TIP]
> **Key Keyword cho Khóa luận**: "Hệ thống hỗ trợ ra quyết định dựa trên dữ liệu thời gian thực" (Real-time Data-driven Decision Support System).
