package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill,Integer> {
    @Query("SELECT b FROM Bill b " +
            "JOIN FETCH b.order o " +
            "JOIN FETCH o.orderItems oi " +
            "JOIN FETCH oi.menuItem " +
            "WHERE b.billId = :billId")
    public Bill findByIdWithOrderAndItems(@Param("billId") Integer billId);
}
