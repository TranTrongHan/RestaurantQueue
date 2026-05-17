package com.tth.RestaurantApplication.repository;

import com.tth.RestaurantApplication.entity.Reservation;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.specification.ReservationSpecification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface ReservationRepository
        extends JpaRepository<Reservation, Integer>, JpaSpecificationExecutor<Reservation> {

    public List<Reservation> findByUserOrderByBookingTimeDesc(User currentUser);

    public Page<Reservation> findByUser(User user, Pageable pageable);

    /**
     * Tìm tất cả reservation của user với các status cụ thể
     */
    public List<Reservation> findByUserAndStatusIn(User user, Set<Reservation.ReservationStatus> statuses);

    @Query("SELECT r FROM Reservation r WHERE r.table.tableId = :tableId AND r.status = :status ORDER BY r.checkinTime DESC")

    public List<Reservation> findActiveReservationsByTable(
            @Param("tableId") Integer tableId,
            @Param("status") Reservation.ReservationStatus status);

}
