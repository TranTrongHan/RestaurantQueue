# Cài đặt N-gram Full-Text Search cho MenuItem

Dựa vào các thông tin bạn cung cấp (dùng N-gram parser, tìm kiếm mức độ tương đồng bằng Natural Language Mode, trên field `name`, ở MySQL 8.x), mình xin đề xuất kế hoạch triển khai sau.

## Proposed Changes

Chúng ta sẽ điều chỉnh file SQL script của bạn và thêm các tầng truy vấn cần thiết trong ứng dụng Spring Boot.

### 1. Database Schema
Cập nhật file script SQL cung cấp cấu trúc bảng `menu_item` để có Index N-gram:

#### [MODIFY] Script SQL Khởi tạo bảng
Thêm dòng `FULLTEXT(name) WITH PARSER ngram` vào cuối khai báo `CREATE TABLE`.

```sql
CREATE TABLE `menu_item` (
    `menu_item_id` INT PRIMARY KEY AUTO_INCREMENT,
    `category_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
	`image` VARCHAR(255) DEFAULT NULL,
    `is_available` BOOLEAN DEFAULT TRUE,
    `avg_cooking_time` DOUBLE PRECISION,
    `base_cooking_time` DOUBLE PRECISION,
    FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    -- Thêm FULLTEXT INDEX với N-gram Parser
    FULLTEXT(name) WITH PARSER ngram
) ENGINE=InnoDB;

-- (Giữ nguyên phần INSERT INTO như cũ)
```

---

### 2. Spring Boot Application

Cập nhật các lớp (Repository, Service, Controller) để gọi truy vấn FTS.

#### [MODIFY] [MenuItemRepository.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/repository/MenuItemRepository.java)
Thêm một custom query sử dụng Native Query vì JPA HQL không có sẵn cú pháp FTS.

```java
// Thêm vào repository
@Query(value = "SELECT * FROM menu_item m WHERE MATCH(m.name) AGAINST(:keyword IN NATURAL LANGUAGE MODE) AND m.is_available = true", nativeQuery = true)
List<MenuItem> searchByNameFts(@Param("keyword") String keyword);
```

#### [MODIFY] [MenuItemService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/MenuItemService.java)
Thêm hàm gọi query `searchByNameFts` và convert kết quả thành `MenuItemResponse`.

```java
// Thêm vào MenuItemService
public List<MenuItemResponse> searchMenuItemByName(String keyword) {
    if (keyword == null || keyword.trim().isEmpty()) {
        return getListMenuItem(null);
    }
    List<MenuItem> menuItems = menuItemRepository.searchByNameFts(keyword.trim());
    return menuItems.stream()
            .map(menuItemMapper::toMenuItemResponse)
            .collect(Collectors.toList());
}
```

#### [MODIFY] [MenuItemController.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/MenuItemController.java)
Tạo API Endpoint `/api/menu_items/search` nhận tham số `q` (query).

```java
// Thêm vào MenuItemController
@GetMapping("/search")
public ApiResponse<List<MenuItemResponse>> searchMenuItems(@RequestParam(value = "q") String keyword) {
    return ApiResponse.<List<MenuItemResponse>>builder()
            .result(menuItemService.searchMenuItemByName(keyword))
            .message("Search menu items successfully")
            .build();
}
```

## User Review Required

> [!IMPORTANT]
> - Kế hoạch này sẽ thay đổi SQL schema (`CREATE TABLE`). Nếu bạn đã lỡ chạy script tạo Data rồi, bạn cần DROP TABLE và chạy lại đoạn Script mới, HOẶC mình sẽ cho bạn một lệnh `ALTER TABLE` ngắn gọn để add index thay vì xóa hết data.
> - Endpoint `/search` sẽ trả về ds kết quả `MenuItemResponse` như bình thường.

## Open Questions
- Bạn có muốn mình **tự động sửa code Java** trên các file Controller, Service, Repository luôn cho bạn trong bước tiếp theo không? (File Script SQL bạn có thể tự copy & chạy vào Workbench nhé).

## Verification Plan
- Chỉnh sửa code Spring Boot. Mở lại ứng dụng và gọi API thử thông qua Swagger / Postman với URL `GET /api/menu_items/search?q=lẩu`.
