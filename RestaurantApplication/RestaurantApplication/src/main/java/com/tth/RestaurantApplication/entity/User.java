package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.security.AuthProvider;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "user")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "dob")
    @Temporal(TemporalType.DATE)
    private LocalDate dob;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "password", nullable = true)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "image")
    private String image;

    @Column(name = "food_preference", length = 1000)
    private String foodPreference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_tier_id")
    private MembershipTier membershipTier;

    @Column(name = "total_spending", precision = 19, scale = 2)
    private java.math.BigDecimal totalSpending;

    @Column(name = "loyalty_points")
    private Integer loyaltyPoints;
    @OneToOne(mappedBy = "user")
    private Chef chef;

    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider;

    public enum AuthProvider {
        LOCAL,
        GOOGLE,
    }

    @OneToMany(mappedBy = "user")
    private List<Reservation> reservations;

    @OneToMany(mappedBy = "user")
    private List<OnlineOrder> onlineOrders;

    @OneToMany(mappedBy = "user")
    private List<OnlineCart> onlineCarts;

    public enum Role {
        CUSTOMER, CHEF, STAFF, ADMIN
    }

}