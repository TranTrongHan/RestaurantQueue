package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionsRepository extends JpaRepository<Promotion,Integer> {

    Promotion findByName(String name);
}
