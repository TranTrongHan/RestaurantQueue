# Hướng Dẫn & Prompt Template Cho Gamma AI (GlowHotpot Graduation Thesis Slides)

Chào bạn, đây là **Plan và Prompt Template tối ưu hóa 100% dành cho Gamma AI** để tạo ra bộ slide thuyết trình khóa luận tốt nghiệp với đúng **24 slides chuyên nghiệp**, bám sát mã nguồn hiện tại của dự án **GlowHotpot**.

---

## I. HƯỚNG DẪN CÁCH SỬ DỤNG TRÊN GAMMA AI

Để Gamma AI tạo ra slide đẹp và chính xác nhất theo cấu trúc toán học và kỹ thuật, bạn làm theo các bước sau:
1.  Truy cập vào [Gamma.app](https://gamma.app) và đăng nhập.
2.  Chọn **Create new (Tạo mới)** -> Chọn **Generate (Tự động tạo)**.
3.  Chọn **Presentation (Bài thuyết trình)**.
4.  Khi hệ thống yêu cầu nhập mô tả/chủ đề, hãy **Copy toàn bộ phần nội dung trong ô Prompt Template dưới đây (Mục II)** và dán vào.
5.  Chọn số lượng slide là **20+ slides** (nếu Gamma cho phép tùy chọn số lượng, hoặc nhập lệnh trực tiếp bắt buộc tạo đủ 24 slide).
6.  Chọn ngôn ngữ đầu ra là **Tiếng Việt (Vietnamese)**.
7.  Chọn một chủ đề màu sắc hiện đại dạng **Modern Dark** hoặc **Deep Tech** (phù hợp với vibe *GlowHotpot* ẩm áp lung linh và công nghệ AI).

---

## II. PROMPT TEMPLATE DÀNH CHO GAMMA AI (COPY TOÀN BỘ PHẦN NÀY)

```markdown
Create a highly professional university graduation thesis presentation in Vietnamese for a software engineering defense.

System Name: GlowHotpot - Hệ thống Quản lý Hàng chờ và Đặt lẩu thông minh tích hợp AI & Realtime Sync.

Act as both a principal software architect and a senior presentation designer. The presentation must be technically rigorous, visually structured, and exceptionally precise.

=== FORMAT RULES ===
- Use concise bullet points and bold technical terms.
- Use ASCII flowcharts, Mermaid diagrams, or structured tables to explain architectures and workflows.
- Strictly include mathematical formulas and equations in LaTeX or raw clean text.
- Avoid generic marketing explanations, commercial phrases, or long dense paragraphs.

=== AUDIENCE ===
University defense committee, F&B technology researchers, and software engineers.

=== SLIDE-BY-SLIDE CONTENT OUTLINE (Generate EXACTLY 24 Slides) ===

Slide 1: Giới thiệu Đề tài (Title Slide)
- Title: GlowHotpot: Hệ thống Quản lý Hàng chờ và Đặt lẩu thông minh
- Subtitle: Khóa luận Tốt nghiệp Kỹ sư Phần mềm - Hệ thống tích hợp AI RAG và Đồng bộ hóa Thời gian thực KDS
- Presenter: [Tên của bạn] - Người hướng dẫn: [Tên GVHD]

Slide 2: Lý do chọn đề tài (Context & Problem Statement)
- Thực trạng: Ngành F&B (đặc biệt là ẩm thực lẩu buffet) thường xuyên bị quá tải hàng chờ giờ cao điểm, gây trải nghiệm tệ cho khách hàng và giảm hiệu suất chế biến của nhà bếp.
- Thách thức kỹ thuật: Các phần mềm POS truyền thống thiếu khả năng ước lượng thời gian chờ thực tế, gọi món tại bàn không đồng bộ thời gian thực, và thiếu tư vấn tự động hóa cá nhân hóa.
- Giải pháp: Xây dựng GlowHotpot - hệ sinh thái chuyển đổi số khép kín toàn diện từ đặt chỗ online, kích hoạt bàn ẩn danh, gọi món thời gian thực và quản lý nhà bếp thông minh.

Slide 3: Mục tiêu đề tài (Project Goals)
- Giảm thiểu 35%+ thời gian chờ món thông qua thuật toán điều phối bếp tự động.
- Trải nghiệm thông minh: Ứng dụng AI Chatbot RAG tư vấn thực đơn lẩu chuẩn xác và tự học sở thích ăn uống của từng khách hàng.
- Đồng bộ hóa tức thời: Kết nối 2 chiều không trễ giữa máy tính bảng tại bàn ăn (Kiosk) và màn hình hiển thị nhà bếp (KDS).
- Đóng gói hoàn chỉnh: Hệ thống dễ dàng triển khai đa nền tảng nhờ Docker containerization.

Slide 4: Tổng quan Kiến trúc Công nghệ (Tech Stack Blueprint)
- Frontend: ReactJS, Vite, TailwindCSS (Tối ưu SPA tốc độ cao, thiết kế đáp ứng đa thiết bị Mobile/Kiosk/Desktop).
- Backend: Java Spring Boot v3, Hibernate/JPA, Spring Security, JWT, OAuth2 (Hệ thống API mạnh mẽ, bảo mật cao).
- Căn cứ dữ liệu & Hạ tầng: MySQL (Cơ sở dữ liệu quan hệ), Redis Stack (Vector Database & Cache), Firebase/Firestore (Đồng bộ Real-time), Docker & Compose (Containerization).

Slide 5: Công nghệ Backend - Java Spring Boot & MySQL
- Vai trò: Trọng tâm xử lý logic nghiệp vụ hệ thống API, quản lý đặt chỗ, quản lý thanh toán trực tuyến.
- Lý do chọn: Spring Boot cung cấp mô hình Dependency Injection mạnh mẽ, xử lý Transaction tối ưu bảo toàn dữ liệu tài chính (Bill, Voucher), kết hợp Hibernate/JPA chống lỗi truy vấn N+1 hiệu quả.

Slide 6: Công nghệ Frontend - ReactJS, Vite & TailwindCSS
- Vai trò: Xây dựng Kiosk tại bàn, Web đặt bàn online cho khách, và Admin Dashboard cho người quản trị.
- Lý do chọn: Vite cho tốc độ build vượt trội so với Webpack truyền thống; mô hình Component tái sử dụng cao trong React giúp phát triển nhanh giao diện đặt món, giỏ hàng, và báo cáo đồ thị.

Slide 7: Công nghệ Real-time - Firebase / Firestore
- Vai trò: Đồng bộ hóa trạng thái bếp (KDS) và trạng thái đơn hàng tại Kiosk của khách hàng tức thời.
- Lý do chọn: Kiến trúc Event-driven và Listener thời gian thực của Firestore giúp truyền tải dữ liệu món ăn thay đổi (Pending -> Cooking -> Done) ngay lập tức đến các thiết bị mà không cần cơ chế Polling liên tục làm hao tổn tài nguyên máy chủ.

Slide 8: Công nghệ AI & Caching - Redis Stack (RedisJSON & RedisSearch)
- Vai trò: Cache thông tin món ăn tốc độ cao và lưu trữ vector embeddings (768 chiều) phục vụ AI Chatbot.
- Lý do chọn: Cho phép tìm kiếm lân cận gần nhất (KNN Search) trực tiếp trên RAM với độ trễ cực thấp (< 2ms), là nền t tím ưu cho cơ chế RAG (Retrieval-Augmented Generation).

Slide 9: Trí tuệ Nhân tạo - Google Gemini 2.5 Flash API
- Vai trò: Động cơ xử lý ngôn ngữ tự nhiên (NLP) cho AI Chatbot tư vấn món ăn của GlowHotpot.
- Lý do chọn: Tốc độ phản hồi cực nhanh (Low latency), ngữ cảnh đầu vào lớn và chi phí tối ưu, tích hợp mượt mà thông qua thư viện Google GenAI SDK mới nhất.

Slide 10: Kiến trúc Toàn cảnh Hệ thống (System Architecture Diagram)
- Vẽ sơ đồ phân lớp kiến trúc (Dạng ASCII):
  [Client: Web / Kiosk App] 
         │ (HTTP REST / Axios / Real-time Listeners)
         ▼
  [API Gateway / Spring Security JWT]
         │ 
         ├─► [Firebase Firestore] (Real-time KDS Sync)
         ├─► [Spring Boot App Service] ──► [MySQL DB]
         └─► [Redis Stack Vector DB] & [Gemini API] (AI RAG Chatbot)

Slide 11: Sơ đồ Thực thể Liên kết hệ thống (ERD Database Schema)
- Cấu trúc: Sơ đồ quan hệ thực thể quan trọng của hệ thống MySQL `restaurantdb`.
- Điểm cốt lõi 1: Bảng `ORDER` đóng vai trò trung tâm đa tuyến, liên kết `1:1` tùy chọn tới `ORDER_SESSION` (Ăn tại bàn) và `ONLINE_ORDER` (Giao hàng online), giúp đồng bộ hóa hóa đơn thanh toán (`BILL`) về một nguồn.
- Điểm cốt lõi 2: Phân hạng ưu tiên `MEMBERSHIP_TIER` liên kết `1:N` với `USER` và ảnh hưởng trực tiếp tới `priority_score` trong bảng chi tiết món nấu `ORDER_ITEM`.
- Điểm cốt lõi 3: Ví ưu đãi khách hàng `USER_VOUCHER` liên kết kiểm tra chéo với bảng `VOUCHER` và áp dụng trực tiếp khấu trừ giảm giá trong `BILL`.

Slide 12: Luồng Đặt Bàn Trực Tuyến & Kích Hoạt Bàn Ẩn Danh (Scan-to-Unlock)
- Bước 1: Khách đặt bàn online trước trên Web -> Tạo thực thể `RESERVATION` trạng thái `BOOKED`.
- Bước 2: Khi khách đến nhà hàng, nhân viên check-in -> Chuyển bàn sang trạng thái `OCCUPIED`.
- Bước 3 (Scan-to-Unlock): Khách hàng quét mã QR tại bàn để kích hoạt phiên ăn ẩn danh, sinh ra một `OrderSession` bảo mật chứa `session_token` riêng biệt có hiệu lực trong 4 tiếng, cho phép khách gọi món tự phục vụ an toàn mà không cần đăng nhập.

Slide 13: Luồng Gọi Món & Theo Dõi Trạng Thái Bếp Real-time
- Khách hàng chọn món tại Kiosk tại bàn -> Bấm Gửi món -> Tạo thực thể `ORDER_ITEM` trạng thái `PENDING` trong MySQL.
- Hệ thống đẩy đồng thời đơn món mới lên Firebase Firestore của bàn tương ứng.
- Màn hình bếp KDS nhận được thông báo thời gian thực thông qua listener -> Đầu bếp nhận món, nhấn bắt đầu nấu -> Trạng thái đổi thành `COOKING` -> Kiosk của khách đổi màu sang "Đang nấu".
- Món ăn nấu xong -> Đầu bếp bấm Hoàn thành -> Trạng thái đổi thành `DONE` -> Kiosk thông báo "Món đã sẵn sàng".

Slide 14: Kiến thức Nền tảng - Vector Embedding & Tìm kiếm lân cận KNN (Core AI Terminology)
- Vector Embedding: Là quá trình chuyển đổi dữ liệu thực đơn phi cấu trúc (như mô tả món ăn bằng văn bản) thành một mảng số toán học đa chiều (Vector 768 chiều). Chuỗi số này mang thông tin ngữ nghĩa sâu sắc của món ăn, giúp máy tính hiểu được "lẩu nấm" và "lẩu chay" có mức độ liên quan ngữ nghĩa gần nhau hơn so với các món tráng miệng khác.
- Tìm kiếm lân cận KNN (K-Nearest Neighbors): Là thuật toán tìm kiếm các điểm gần nhất trong không gian vector đa chiều. Trong GlowHotpot, khi khách hỏi chatbot, câu hỏi được đổi sang vector, hệ thống dùng KNN để tìm ra K món ăn gần nhất có độ tương đồng khoảng cách Cosine cao nhất, làm cơ sở dữ liệu ngữ cảnh chính xác cho Gemini tư vấn.

Slide 15: Luồng Kỹ thuật - Quy trình Embedding thực đơn lẩu (Menu Data Embedding Pipeline)
- Tác nhân kích hoạt: Quản trị viên thêm hoặc cập nhật món lẩu tại trang quản lý [ProductsPage.jsx].
- Bước 1 (Tiền xử lý): Spring Boot (`MenuItemVectorService`) trích xuất các thuộc tính của món lẩu (Tên, Giá, Mô tả, Phân loại) và chuyển thành một chuỗi dữ liệu chuẩn hóa dạng văn bản.
- Bước 2 (Tạo Vector): Hệ thống gửi chuỗi văn bản mô tả sang Gemini Embedding API (`gemini-embedding-001`) nhận về Vector toán học 768 chiều mang ngữ nghĩa sâu sắc của món ăn.
- Bước 3 (Vector Database Sync): Vector và siêu dữ liệu được đồng bộ hóa tức thì vào Redis Stack dưới dạng RedisJSON và lập chỉ mục Vector (`menuItemIdx`) sẵn sàng cho truy vấn KNN.

Slide 16: Luồng Kỹ thuật - Quy trình Chatbot Gemini tư vấn món ăn (AI Chatbot Flow)
- Bước 1 (Khởi động & Mở rộng): Khách hàng mở khung chat [ChatbotDrawer.jsx] tại Kiosk -> Đặt câu hỏi -> Hệ thống lấy 4 lượt chat gần nhất từ Redis để thực hiện kỹ thuật Mở rộng câu truy vấn (Query Expansion).
- Bước 2 (Tìm kiếm lân cận KNN): Vector hóa câu hỏi mở rộng -> Truy vấn tìm kiếm KNN 5 món lẩu gần nhất từ Redis Stack bằng khoảng cách Cosine: `* => [KNN 5 @vector $vec AS score]`.
- Bước 3 (Gọi LLM & Sinh phản hồi): Đóng gói lịch sử chat, thông tin khách hàng và ngữ cảnh thực đơn lẩu thực tế truyền vào Gemini 2.5 Flash -> Trả về câu tư vấn thực đơn trực quan, chuẩn xác tuyệt đối, tránh hiện tượng ảo tưởng (Hallucination) về món lẩu không có trong nhà hàng.

Slide 17: Thuật toán 1 - Ước tính Thời gian Chờ Bếp Động (Wait-Time Estimation)
- Bài toán: Dự đoán chính xác thời gian hoàn thành của món ăn vừa đặt dựa trên tải thực tế của nhà bếp.
- Công thức toán học cốt lõi:
  EstimatedTime = MaxRemainingCookingTime_stoves + (PendingLoad_queue / KitchenCapacity) + SelfPrepTime
- Giải thích biến số:
  + MaxRemainingCookingTime_stoves: Thời gian còn lại lớn nhất của các món đang nấu trên bếp: max(0, EffectivePrepTime - ElapsedTime).
  + PendingLoad_queue: Tổng tải thời gian nấu của các món đang đợi trong hàng chờ: Sum(EffectivePrepTime * Quantity).
  + KitchenCapacity: Năng suất phục vụ của bếp nấu (Cấu hình động tại hệ thống).
  + SelfPrepTime: Thời gian chuẩn bị cơ bản của món ăn đó.

Slide 18: Thuật toán 2 - Tự học Hiệu chỉnh Năng suất Bếp (EMA Formula)
- Bài toán: Tốc độ nấu của đầu bếp thực tế thay đổi liên tục. Hệ thống cần tự động cập nhật thời gian nấu trung bình của món ăn để thuật toán ước tính thời gian chờ ngày càng chính xác hơn.
- Công thức toán học (Exponential Moving Average):
  AvgCookingTime_new = AvgCookingTime_current * (1 - Alpha) + ActualCookingTime * Alpha
- Trong đó:
  + Alpha = 0.3: Hệ số học (Trọng số thích ứng).
  + ActualCookingTime: Thời gian nấu thực tế đo đạc được từ lúc đầu bếp chuyển trạng thái món sang COOKING đến khi sang DONE.

Slide 19: Chức năng Khách hàng - Đặt Bàn, Hạng Thành Viên & Ví Voucher
- Giao diện Đặt bàn online: Chọn ngày, giờ, số lượng khách, vị trí bàn mong muốn và ghi chú đặc biệt. Cho phép khách hàng quản lý và theo dõi lịch sử trạng thái đặt bàn trực tuyến cá nhân.
- Phân hạng ưu tiên (Loyalty Program): Tự động tính điểm thưởng và thăng hạng thành viên dựa trên tổng chi tiêu thực tế (Hạng mặc định -> Silver -> Gold). Tích lũy điểm thưởng để đổi lấy các Voucher giảm giá trực tiếp.
- Ví Voucher bảo mật: Quản lý ví mã ưu đãi cá nhân, áp dụng mã tự động khi ăn lẩu tại bàn và đảm bảo kiểm tra điều kiện áp dụng nghiêm ngặt (Ngày hết hạn, giá trị tối thiểu, hạng thành viên).

Slide 20: Chức năng Admin - Quản lý Bàn ăn & Thực đơn
- Quản lý sơ đồ bàn trực quan (Table Management): Hiển thị trạng thái các bàn lẩu theo thời gian thực (AVAILABLE, BOOKED, OCCUPIED), sức chứa bàn ăn, tên bàn.
- Quản lý thực đơn (Product Management): Thêm, sửa, xóa món lẩu, cấu hình thời gian chuẩn bị gốc (`base_cooking_time`), cập nhật hình ảnh món ăn lên Cloudinary, điều chỉnh trạng thái còn/hết món.

Slide 21: Chức năng Admin - Tiếp đón Khách vãng lai & Check-in ẩn danh bằng QR
- Tiếp đón khách vãng lai (Walk-in Management): Quản trị viên xem sơ đồ bàn trực quan, chọn các bàn trống (AVAILABLE) phù hợp với số lượng khách vãng lai vừa tới.
- Tạo mã QR Check-in động: Admin kích hoạt check-in trực tiếp cho bàn ăn -> Chuyển trạng thái bàn sang OCCUPIED và sinh mã QR kích hoạt bàn động (Scan-to-Unlock QR Code).
- Kích hoạt phiên gọi món tự phục vụ: Khách vãng lai quét mã QR trực tiếp tại bàn, hệ thống sinh phiên `OrderSession` ẩn danh liên kết trực tiếp với bàn tương ứng mà không cần khách đăng nhập tài khoản.

Slide 22: Chức năng Admin - Quản lý Khách hàng & Chương trình Ưu đãi
- Quản lý khách hàng (Customer Management): Theo dõi danh sách tài khoản, hạng thành viên, lịch sử giao dịch và thống kê doanh số khách hàng đóng góp.
- Quản lý chương trình khuyến mãi (Vouchers Management): Thiết lập mã Voucher mới, phân phối voucher thăng hạng tự động cho hạng Bạc/Vàng, cấu hình mức giảm giá cố định hoặc phần trăm.

Slide 23: Đánh giá Kết quả đạt được, Hạn chế & Hướng phát triển
- Kết quả: Hệ thống vận hành đồng bộ thời gian thực ổn định, thuật toán ước tính thời gian hoạt động chính xác cao, chatbot tư vấn thông minh, bảo mật phân quyền chặt chẽ.
- Hạn chế: Thuật toán điều phối bếp chưa phân chia tối ưu khi có nhiều chi nhánh nhà hàng cùng lúc.
- Hướng phát triển: Tích hợp hệ thống quản lý kho nguyên liệu tự động (tránh hết món đột xuất), mở rộng hệ thống sang mô hình chuỗi (Multi-branch) và ứng dụng Deep Learning để dự báo số lượng khách đặt bàn theo tuần.

Slide 24: Lời cảm ơn (Q&A Slide)
- Cảm ơn Hội đồng Phản biện và các thầy cô giáo đã lắng nghe bài thuyết trình tốt nghiệp đề tài GlowHotpot.
- Sẵn sàng đón nhận các câu hỏi phản biện chuyên môn từ hội đồng.
```

---

## III. TỔNG HỢP LIÊN KẾT MÃ NGUỒN FRONT-END TƯƠNG ỨNG VỚI SLIDE

Để bạn có thể tự tin trả lời trước hội đồng khi được hỏi *"Giao diện chức năng đó nằm ở đâu trong code?"*, dưới đây là bảng ánh xạ chi tiết:

| Nội dung Slide | Tên Giao diện / Chức năng | Đường dẫn file tương ứng trong mã nguồn |
| :--- | :--- | :--- |
| **Slide 12** | Kích hoạt phiên ăn ẩn danh | [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx#L72) *(Tạo sessionToken kích hoạt)* |
| **Slide 13** | Theo dõi trạng thái KDS bếp | [KitchenOrdersPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/KitchenOrdersPage.jsx) *(Màn hình KDS bếp của admin)* |
| **Slide 15** | Đồng bộ dữ liệu thực đơn lên Vector DB | [ProductsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ProductsPage.jsx) & [MenuItemVectorController.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/MenuItemVectorController.java) |
| **Slide 16** | Gọi Chatbot Gemini tư vấn | [ChatbotDrawer.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/common/ChatbotDrawer.jsx) & [ChatbotService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/ChatbotService.java) |
| **Slide 19** | Đặt bàn của khách | [TableBookingForm.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/forms/TableBookingForm.jsx) |
| **Slide 19** | Thành viên & Ví Voucher | [ProfilePage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/components/pages/ProfilePage.jsx) *(Xem hạng, tích điểm, đổi điểm)* |
| **Slide 20** | Quản lý Bàn & Thực đơn | [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx) & [ProductsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ProductsPage.jsx) |
| **Slide 21** | Kích hoạt bàn & Tiếp đón khách vãng lai | [ReservationsPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationsPage.jsx#L72) & [ReservationDetailPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/ReservationDetailPage.jsx) *(Sinh mã QR động cho khách vãng lai)* |
| **Slide 22** | Khách hàng & Voucher | [CustomersPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/CustomersPage.jsx) & [VouchersPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/VouchersPage.jsx) |
