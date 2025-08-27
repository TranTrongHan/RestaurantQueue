package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.OnlineOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OnlineOrderRepository extends JpaRepository<OnlineOrder,Integer> {
    public List<OnlineOrder> findByUser_UserId(Integer userId);
}
