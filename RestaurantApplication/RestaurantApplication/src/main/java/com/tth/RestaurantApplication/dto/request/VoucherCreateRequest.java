package com.tth.RestaurantApplication.dto.request;

import com.tth.RestaurantApplication.entity.Voucher;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherCreateRequest {
    @NotBlank
    String voucherCode;
    @NotBlank
    String voucherName;
    @NotNull
    Voucher.VoucherType voucherType;
    @NotNull
    BigDecimal discountValue;
    BigDecimal maxDiscountAmount;
    BigDecimal minOrderValue;
    @NotNull
    LocalDateTime startDate;
    @NotNull
    LocalDateTime endDate;
    Integer targetTierId;
    Boolean isNewMemberVoucher = false;
    Boolean isLevelUpReward = false;
    Integer pointsRequired = 0;
    @NotNull
    Voucher.ApplyType applyType;
    String description;
}
