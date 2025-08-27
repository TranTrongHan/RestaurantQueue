package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.OnlineCart;
import com.tth.RestaurantApplication.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnlineCartRepository extends JpaRepository<OnlineCart,Integer> {
    // Lấy tất cả items trong cart của user,sắp xếp theo thời gian thêm mới nhất

    List<OnlineCart> findByUserOrderByAddedAtDesc( User user);

    // Kiểm tra xem item đã có trong cart chưa
    Optional<OnlineCart> findByUserAndMenuItem( User user, MenuItem menuItem);

    // Đếm số lượng items trong cart của user
    @Query("SELECT COUNT(c) FROM OnlineCart c WHERE c.user = :user")
    Integer countByUser(@Param("user") User user);

    // Xóa tất cả items trong cart của user
    void deleteByUser(User user);

    // Lấy cart item theo user và menu item ID
    @Query("SELECT c FROM OnlineCart c WHERE c.user = :user AND c.menuItem.menuItemId = :menuItemId")
    Optional<OnlineCart> findByUserAndMenuItemId(@Param("user") User user, @Param("menuItemId") Integer menuItemId);

    // Lấy cart item theo cart ID và user (để kiểm tra quyền sở hữu)
    @Query("SELECT c FROM OnlineCart c WHERE c.cartId = :cartId AND c.user = :user")
    Optional<OnlineCart> findByCartIdAndUser(@Param("cartId") Integer cartId, @Param("user") User user);

    // Lấy tổng số lượng items trong cart của user
    @Query("SELECT SUM(c.quantity) FROM OnlineCart c WHERE c.user = :user")
    Integer getTotalQuantityByUser(@Param("user") User user);

    // Kiểm tra xem user có items trong cart không
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM OnlineCart c WHERE c.user = :user")
    Boolean hasItemsInCart(@Param("user") User user);
}
