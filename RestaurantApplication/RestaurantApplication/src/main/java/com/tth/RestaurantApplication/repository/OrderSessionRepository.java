package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.OrderSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderSessionRepository  extends JpaRepository<OrderSession,Integer> {
    Optional<OrderSession> findBySessionToken(String token);
}
