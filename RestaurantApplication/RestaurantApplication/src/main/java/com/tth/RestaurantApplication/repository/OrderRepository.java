package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order,Integer> {
    public Order findByOnlineOrder_OnlineOrderId(Integer onlineOrderId);
    Order findByOrderSession(OrderSession orderSession);


}
