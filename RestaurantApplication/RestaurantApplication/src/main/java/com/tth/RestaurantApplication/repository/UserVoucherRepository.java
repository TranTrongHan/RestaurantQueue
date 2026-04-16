package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Integer> {
    List<UserVoucher> findByUserUserId(Integer userId);

    List<UserVoucher> findByUserUserIdAndIsUsed(Integer userId, Boolean isUsed);

    @Modifying
    @Query("DELETE FROM UserVoucher uv WHERE uv.voucher.id = :voucherId")
    void deleteByVoucherId(@org.springframework.data.repository.query.Param("voucherId") Integer voucherId);
}
