package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Integer> {
    List<UserVoucher> findByUserUserId(Integer userId);
    List<UserVoucher> findByUserUserIdAndIsUsed(Integer userId, Boolean isUsed);
}
