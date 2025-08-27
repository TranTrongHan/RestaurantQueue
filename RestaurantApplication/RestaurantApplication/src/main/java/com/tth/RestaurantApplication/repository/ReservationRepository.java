package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Reservation;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.specification.ReservationSpecification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation,Integer>, JpaSpecificationExecutor<Reservation> {


    public List<Reservation> findByUserOrderByBookingTimeDesc(User currentUser);
    
    /**
     * Tìm tất cả reservation của user với các status cụ thể
     */
    public List<Reservation> findByUserAndStatusIn(User user, Set<Reservation.ReservationStatus> statuses);
}
