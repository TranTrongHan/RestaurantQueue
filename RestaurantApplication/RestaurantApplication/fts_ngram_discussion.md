# Thảo luận: Implement Full-Text Search (FTS) với N-gram Parser trong MySQL

## 1. Tổng quan về N-gram Parser trong MySQL
Mặc định, Full-Text Search của MySQL sử dụng space (khoảng trắng) để tách từ. Điều này hoạt động tốt với tiếng Anh, nhưng với tiếng Việt (hoặc tiếng Trung, Nhật, Hàn), các từ có thể bao gồm nhiều âm tiết, hoặc người dùng tìm kiếm theo chuỗi con không nằm ở đầu từ.

**N-gram parser** giải quyết vấn đề này bằng cách chia văn bản thành các chuỗi con liền kề có độ dài `n`.
Ví dụ với `n=2` (bi-gram) và chuỗi "Bún bò Huế", N-gram parser sẽ tách thành: `Bú`, `ún`, `n `, ` b`, `bò`, `ò `, ` H`, `Hu`, `uế`.

Lợi ích:
- Tìm kiếm chính xác được chuỗi con ở bất kỳ đâu trong từ (VD: tìm "bò" vẫn ra "Bún bò". Ngay cả khi chuỗi dính liền nhau).
- Không phụ thuộc vào dấu cách.

## 2. Cách cài đặt (Database Level)

### 2.1. Cấu hình độ dài N-gram (`ngram_token_size`)
Mặc định trong MySQL, tham số `ngram_token_size` là `2` (tối ưu cho ngôn ngữ châu Á). Với giá trị này, nếu người dùng tìm bằng 1 ký tự, cơ sở dữ liệu sẽ bỏ qua. Để tìm chuẩn thông thường tại Việt Nam, `2` là con số phù hợp. Không nên đổi về `1` trừ khi thực sự cần thiết vì làm dung lượng Index tăng rất lớn.

### 2.2. Tạo Full-Text Index
Giả sử entity của bạn là `Food` (hoặc `Dish`) và lưu trữ dưới CSDL là bảng tên `food`. Bạn muốn cho phép tìm theo `name` và `description`.

```sql
-- Nếu tạo bảng mới:
CREATE TABLE food (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    -- Khai báo index
    FULLTEXT(name, description) WITH PARSER ngram
);

-- Nếu bảng đã có sẵn, dùng lệnh ALTER để tạo thêm Index:
ALTER TABLE food ADD FULLTEXT INDEX ft_index_name_desc (name, description) WITH PARSER ngram;
```

### 2.3. Cú pháp truy vấn FTS (Ví dụ SQL)
```sql
SELECT * FROM food 
WHERE MATCH(name, description) AGAINST('bún bò' IN NATURAL LANGUAGE MODE);

-- Hoặc BOOLEAN MODE để dùng toán tử + (bắt buộc có) - (bắt buộc KHÔNG có)
SELECT * FROM food 
WHERE MATCH(name, description) AGAINST('+bún +bò' IN BOOLEAN MODE);
```

## 3. Tích hợp trong Spring Boot (Data JPA)

Trong repository của Spring Data JPA, HQL (Hibernate Query Language) mặc định không hỗ trợ cú pháp `MATCH() AGAINST()`. Do đó, cách tốt nhất là sử dụng `Native Query`.

```java
public interface FoodRepository extends JpaRepository<Food, Long> {
    
    // Sử dụng Native Query để gọi Full-Text Search
    @Query(value = "SELECT * FROM food WHERE MATCH(name, description) AGAINST(:keyword IN BOOLEAN MODE)", nativeQuery = true)
    List<Food> searchFtsNgram(@Param("keyword") String keyword);
    
    // Nếu cần kết hợp phân trang (Pagination)
    @Query(value = "SELECT * FROM food WHERE MATCH(name, description) AGAINST(:keyword IN BOOLEAN MODE)", 
           countQuery = "SELECT count(*) FROM food WHERE MATCH(name, description) AGAINST(:keyword IN BOOLEAN MODE)",
           nativeQuery = true)
    Page<Food> searchFtsNgramPageable(@Param("keyword") String keyword, Pageable pageable);
}
```

> [!TIP]
> **Mẹo xử lý chuỗi ở tầng Service:** Thay vì truyền nguyên input của user vào `:keyword`, ở lớp `FoodService`, bạn có thể tiền xử lý chuỗi.
> Thay vì `"Bún bò"`, bạn chuyển thành `"+Bún +bò"` khi truyền xuống repo (để đảm bảo kết quả chứa đủ mọi từ user cần tìm).

## 4. Ưu và Nhược điểm

**Ưu điểm:**
- Tốc độ xử lý cực kỳ nhanh so với `LIKE '%keyword%'` nhất là khi Database của nhà hàng lớn lên.
- Phù hợp với ngôn ngữ tiếng Việt, giải quyết bài toán chuỗi nối liền và không có dấu cách.

**Nhược điểm:**
- **Dung lượng đĩa:** Index N-gram thường phình ra rất nhanh do phải rã các ký tự thành chuỗi bi-gram.
- Mất thời gian đồng bộ Index khi insert/update lượng dữ liệu lớn.

## 5. Câu hỏi thảo luận dành cho bạn
Để chúng ta cùng thực thi hiệu quả, bạn có thể giúp mình xác nhận:
1. Bạn định **tìm kiếm qua các field nào** trong Entity của món ăn (`name`, `description`, `category_name`, ...)?
2. Bạn dùng **phiên bản MySQL nào** (N-gram parser có sẵn từ MySQL 5.7.6+)?
3. Bạn muốn người dùng tìm **chính xác các từ khóa đó** (Boolean Mode) hay **tìm các kết quả chứa độ tương đồng** (Natural Language)?
4. Chúng ta có sử dụng Flyway hay script SQL thuần để quản lý DB Migration không? (Để mình hướng dẫn chạy file update cấu trúc).

Bạn xem qua file này và phản hồi các câu hỏi ở phần 5 để mình implement phần tiếp theo nhé.
