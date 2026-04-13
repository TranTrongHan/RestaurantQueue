package com.tth.RestaurantApplication.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "voucher")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "voucher_code", unique = true, nullable = false)
    private String voucherCode;

    @Column(name = "voucher_name", nullable = false)
    private String voucherName;

    @Enumerated(EnumType.STRING)
    @Column(name = "voucher_type", nullable = false)
    private VoucherType voucherType;

    @Column(name = "discount_value", precision = 19, scale = 2, nullable = false)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 19, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_value", precision = 19, scale = 2)
    private BigDecimal minOrderValue;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_tier_id")
    private MembershipTier targetTier;

    @Column(name = "is_new_member_voucher")
    private Boolean isNewMemberVoucher = false;

    @Column(name = "is_level_up_reward")
    private Boolean isLevelUpReward = false;

    @Column(name = "points_required")
    private Integer pointsRequired = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_type", nullable = false)
    private ApplyType applyType = ApplyType.BOTH;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    public enum VoucherType {
        PERCENTAGE, FIXED
    }

    public enum ApplyType {
        ONLINE, DINE_IN, BOTH
    }
}
