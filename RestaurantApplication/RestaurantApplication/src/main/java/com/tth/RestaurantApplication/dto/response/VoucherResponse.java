package com.tth.RestaurantApplication.dto.response;

import com.tth.RestaurantApplication.entity.Voucher;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherResponse {
    Integer id;
    String voucherCode;
    String voucherName;
    Voucher.VoucherType voucherType;
    BigDecimal discountValue;
    BigDecimal maxDiscountAmount;
    BigDecimal minOrderValue;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String targetTierName;
    Boolean isNewMemberVoucher;
    Boolean isLevelUpReward;
    Integer pointsRequired;
    Voucher.ApplyType applyType;
    String description;
}
