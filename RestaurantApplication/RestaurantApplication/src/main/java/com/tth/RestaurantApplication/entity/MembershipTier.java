package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "membership_tier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tier_name", nullable = false)
    private String tierName;

    @Column(name = "min_spending", precision = 19, scale = 2, nullable = false)
    private BigDecimal minSpending;

    @Column(name = "point_earning_rate", nullable = false)
    private Double pointEarningRate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "membershipTier")
    private List<User> users;
}
