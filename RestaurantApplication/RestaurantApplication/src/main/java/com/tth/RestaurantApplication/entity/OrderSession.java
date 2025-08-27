package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "order_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    @OneToOne
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    @Column(name = "session_token", nullable = false, unique = true)
    private String sessionToken;

    @Column(name = "create_at", nullable = false)
    private LocalDateTime createdAt;


    @Column(name = "expired_at", nullable = false)   // 👈 thêm trường này
    private LocalDateTime expiredAt;

    @Column(name = "is_active")
    private Boolean isActive;

    @OneToOne(mappedBy = "orderSession",fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private Order order;

    // Getters and Setters...
}