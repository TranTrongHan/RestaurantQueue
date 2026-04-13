package com.tth.RestaurantApplication.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MembershipStatusResponse {
    String tierName;
    Double pointEarningRate;
    String tierDescription;
    BigDecimal totalSpending;
    Integer loyaltyPoints;
    BigDecimal nextTierMinSpending;
    BigDecimal spendingToNextTier;
}
