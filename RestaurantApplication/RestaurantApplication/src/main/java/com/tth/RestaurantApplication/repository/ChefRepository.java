package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Chef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChefRepository extends JpaRepository<Chef, Integer> {
    Optional<Chef> findFirstByIsAvailableTrue();

    List<Chef> findByIsAvailableTrue();
    Integer countByIsAvailableTrue();
}
