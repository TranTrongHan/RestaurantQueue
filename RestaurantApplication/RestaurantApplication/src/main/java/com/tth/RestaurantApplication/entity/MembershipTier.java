package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "membership_tier")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipTier {
    public static final int PRIORITY_GOLD = 3;
    public static final int PRIORITY_SILVER = 2;
    public static final int PRIORITY_NEW_MEMBER = 1;

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

    @Column(name = "max_point_redemption_pct")
    private Integer maxPointRedemptionPct;

    @Column(name = "priority")
    private Integer priority;

    @OneToMany(mappedBy = "membershipTier")
    private List<User> users;
}
