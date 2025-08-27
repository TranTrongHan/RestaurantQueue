package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenAssignmentRepository extends JpaRepository<KitchenAssignment,Integer> {
    List<KitchenAssignment>  findByStatus(KitchenAssignment.KitchenAssignmentStatus status);
    Optional<KitchenAssignment> findTopByChefAndStatusOrderByStartAtDesc(Chef chef, KitchenAssignment.KitchenAssignmentStatus status);
    Page<KitchenAssignment> findAll(Specification<KitchenAssignment> spec, Pageable pageable);
}
