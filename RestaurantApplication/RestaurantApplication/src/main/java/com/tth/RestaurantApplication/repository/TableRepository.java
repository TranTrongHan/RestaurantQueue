package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<TableEntity,Integer>, JpaSpecificationExecutor<TableEntity> {

    Optional<TableEntity> findFirstByStatusAndCapacityOrderByTableIdAsc(
            TableEntity.TableStatus status,
            Integer capacity
    );
}
