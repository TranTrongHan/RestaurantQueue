package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Integer> {
    List<PointTransaction> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
}
