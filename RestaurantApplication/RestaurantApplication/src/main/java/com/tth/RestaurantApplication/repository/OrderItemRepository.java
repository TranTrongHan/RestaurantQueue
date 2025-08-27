package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.OrderItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    List<OrderItem> findByStatusIn(List<OrderItem.OrderItemStatus> statuses);

    List<OrderItem> findByStatus(OrderItem.OrderItemStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT oi FROM OrderItem oi WHERE oi.orderItemId = :id")
    Optional<OrderItem> findByIdForUpdate(@Param("id") Integer id);

    public List<OrderItem> findByOrder_OrderId(Integer orderId);
}
