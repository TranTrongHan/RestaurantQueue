package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Table(name = "reservation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Integer reservationId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "table_id", nullable = false)
    private TableEntity table;

    @Column(name = "booking_time", nullable = false)
    private LocalDateTime bookingTime;

    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;

    @Column(name = "checkout_time")
    private LocalDateTime checkoutTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReservationStatus status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @OneToOne(mappedBy = "reservation")
    private OrderSession orderSession;

    public enum ReservationStatus {
        BOOKED, CHECKEDIN, CHECKEDOUT
    }
    // Getters and Setters...
}
