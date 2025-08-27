package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem,Integer> {
    // Lấy menu item theo ID
    @Query("SELECT m FROM MenuItem m WHERE m.menuItemId = :menuItemId")
    Optional<MenuItem> findByMenuItemId(@Param("menuItemId") Integer menuItemId);

    // Lấy tất cả menu items có sẵn
    @Query("SELECT m FROM MenuItem m WHERE m.isAvailable = true")
    List<MenuItem> findByIsAvailableTrue();

    // Kiểm tra menu item có tồn tại và có sẵn không
//    @Query("SELECT m FROM MenuItem m WHERE m.menuItemId = :menuItemId AND m.isAvailable = true")
    Optional<MenuItem> findByMenuItemIdAndIsAvailableTrue( Integer menuItemId);

    // Tìm menu items theo tên (có chứa từ khóa)
    @Query("SELECT m FROM MenuItem m WHERE m.name LIKE %:keyword% AND m.isAvailable = true")
    List<MenuItem> findByNameContainingAndAvailable(@Param("keyword") String keyword);


    List<MenuItem> findByCategory_CategoryId( Integer categoryId);

    // Tìm menu items theo khoảng giá
    @Query("SELECT m FROM MenuItem m WHERE m.price BETWEEN :minPrice AND :maxPrice AND m.isAvailable = true")
    List<MenuItem> findByPriceBetweenAndAvailable(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice);

    // Lấy menu items có giá dưới một mức nhất định
    @Query("SELECT m FROM MenuItem m WHERE m.price <= :maxPrice AND m.isAvailable = true")
    List<MenuItem> findByPriceLessThanEqualAndAvailable(@Param("maxPrice") BigDecimal maxPrice);

    // Đếm số lượng menu items có sẵn
    @Query("SELECT COUNT(m) FROM MenuItem m WHERE m.isAvailable = true")
    Integer countAvailableItems();

    // Lấy menu items theo thời gian nấu trung bình
    @Query("SELECT m FROM MenuItem m WHERE m.avgCookingTime <= :maxCookingTime AND m.isAvailable = true")
    List<MenuItem> findByCookingTimeLessThanEqual(@Param("maxCookingTime") Double maxCookingTime);
}
