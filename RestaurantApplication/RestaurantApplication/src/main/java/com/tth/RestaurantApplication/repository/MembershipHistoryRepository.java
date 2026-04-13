package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.MembershipHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembershipHistoryRepository extends JpaRepository<MembershipHistory, Integer> {
    List<MembershipHistory> findByUserUserIdOrderByChangedAtDesc(Integer userId);
}
